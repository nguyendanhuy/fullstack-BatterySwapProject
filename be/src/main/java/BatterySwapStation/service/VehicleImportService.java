package BatterySwapStation.service;

import BatterySwapStation.dto.VehicleImportDTO;
import BatterySwapStation.dto.VehicleImportErrorDTO;
import BatterySwapStation.dto.VehicleImportResultDTO;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.Vehicle;
import BatterySwapStation.entity.VehicleBattery;
import BatterySwapStation.repository.BatteryRepository;
import BatterySwapStation.repository.VehicleBatteryRepository;
import BatterySwapStation.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleImportService {

    private static final String CSV_SPLIT_REGEX = ",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)";

    private final VehicleRepository vehicleRepository;
    private final BatteryRepository batteryRepository;
    private final VehicleBatteryRepository vehicleBatteryRepository;

    // VIN must be 17 chars: allowed A-Z (except I O Q) and 0-9
    private static final Pattern VIN_PATTERN = Pattern.compile("^[A-HJ-NPR-Z0-9]{17}$");

    @Transactional
    public VehicleImportResultDTO importVehiclesFromCSV(MultipartFile file) throws IOException {

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File CSV không được để trống");
        }

        if (!isCSVFile(file)) {
            throw new IllegalArgumentException("File phải có định dạng .csv");
        }

        List<VehicleImportDTO> parsedVehicles = parseCSV(file);
        return processImport(parsedVehicles);
    }

    private List<VehicleImportDTO> parseCSV(MultipartFile file) throws IOException {
        List<VehicleImportDTO> vehicles = new ArrayList<>();

        // expected header order (fallback positions)
        final String[] expectedHeaders = new String[]{
                "vin", "vehicletype", "batterytype", "ownername", "licenseplate", "color", "batterycount", "manufacturedate", "purchasedate", "battery_ids"
        };

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();

            if (headerLine == null) {
                throw new IllegalArgumentException("File CSV rỗng");
            }

            // normalize header line (remove BOM if present) and split
            headerLine = headerLine.replace("\uFEFF", "");
            log.debug("CSV header raw: [{}]", headerLine);
            String[] headers = headerLine.split(CSV_SPLIT_REGEX, -1);
            Map<String, Integer> headerIndex = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                String key = headers[i].trim().toLowerCase();
                // remove surrounding quotes if any
                if (key.startsWith("\"") && key.endsWith("\"")) key = key.substring(1, key.length() - 1).trim();
                headerIndex.put(key, i);
            }

            log.debug("Detected CSV headers: {}", headerIndex.keySet());

            // If first line doesn't look like a header (no known column names),
            // treat it as data and parse it as the first row.
            boolean looksLikeHeader = false;
            for (String h : headerIndex.keySet()) {
                if (h.contains("vin") || h.contains("vehicletype") || h.contains("batterytype") || h.contains("licenseplate")) {
                    looksLikeHeader = true;
                    break;
                }
            }

            int rowNumber = 1;

            if (!looksLikeHeader) {
                // headerLine is actually data -> build a default headerIndex based on expected headers
                headerIndex.clear();
                for (int i = 0; i < expectedHeaders.length; i++) {
                    headerIndex.put(expectedHeaders[i], i);
                }

                try {
                    VehicleImportDTO dto = parseCSVLine(headerLine, headerIndex);
                    log.debug("Parsed row {} (treated as data): {}", rowNumber + 1, dto.getVIN());
                    vehicles.add(dto);
                } catch (Exception e) {
                    log.error("Lỗi parse dòng {}: {}", rowNumber + 1, e.getMessage());
                    VehicleImportDTO errorDto = VehicleImportDTO.builder()
                            .errors(List.of("Lỗi parse dòng: " + e.getMessage()))
                            .build();
                    vehicles.add(errorDto);
                }
            }

            String line;
            while ((line = reader.readLine()) != null) {
                rowNumber++;

                if (line.trim().isEmpty()) {
                    log.debug("Skipping empty CSV line {}", rowNumber);
                    continue;
                }

                try {
                    log.debug("Parsing CSV line {}: {}", rowNumber, line);
                    VehicleImportDTO dto = parseCSVLine(line, headerIndex);
                    log.debug("Parsed DTO VIN={} license={} errors={}", dto.getVIN(), dto.getLicensePlate(), dto.getErrors());
                    vehicles.add(dto);
                } catch (Exception e) {
                    log.error("Lỗi parse dòng {}: {}", rowNumber, e.getMessage());
                    VehicleImportDTO errorDto = VehicleImportDTO.builder()
                            .errors(List.of("Lỗi parse dòng: " + e.getMessage()))
                            .build();
                    vehicles.add(errorDto);
                }
            }
        }

        long validCount = vehicles.stream().filter(v -> v != null && v.isValid()).count();
        log.info("Parsed {} rows from CSV (including header-treated-if-needed). Valid vehicles: {}", vehicles.size(), validCount);
        // debug list of vins
        vehicles.stream().filter(Objects::nonNull).forEach(v -> log.debug("Row VIN={} valid={} errors={}", v.getVIN(), v.isValid(), v.getErrors()));

        return vehicles;
    }

    private VehicleImportDTO parseCSVLine(String line, Map<String, Integer> headerIndex) {
        // split preserving quoted commas
        String[] columns = line.split(CSV_SPLIT_REGEX, -1);

        // compatible with previous format: VIN,vehicleType,batteryType,ownerName,licensePlate,color,batteryCount,manufactureDate,purchaseDate, battery_ids(optional)
        String vin = getColumn(columns, headerIndex, "vin", 0);
        String vehicleType = getColumn(columns, headerIndex, "vehicletype", 1);
        String batteryType = getColumn(columns, headerIndex, "batterytype", 2);
        String ownerName = getColumn(columns, headerIndex, "ownername", 3);
        String licensePlate = getColumn(columns, headerIndex, "licenseplate", 4);
        String color = getColumn(columns, headerIndex, "color", 5);
        String batteryCountStr = getColumn(columns, headerIndex, "batterycount", 6);
        String manufactureDate = getColumn(columns, headerIndex, "manufacturedate", 7);
        String purchaseDate = getColumn(columns, headerIndex, "purchasedate", 8);
        String batteryIdsRaw = getColumn(columns, headerIndex, "battery_ids", 9);

        VehicleImportDTO dto = VehicleImportDTO.builder()
                .VIN(vin)
                .vehicleType(vehicleType)
                .batteryType(batteryType)
                .ownerName(ownerName)
                .licensePlate(licensePlate)
                .color(color)
                .batteryCount(parseSafeInteger(batteryCountStr))
                .manufactureDate(manufactureDate)
                .purchaseDate(purchaseDate)
                .userId(null)
                .isActive(false)
                .build();

        // ensure batteryIds list is initialized (defensive)
        if (dto.getBatteryIds() == null) {
            dto.setBatteryIds(new ArrayList<>());
        }

        // parse battery ids list
        if (batteryIdsRaw != null && !batteryIdsRaw.isBlank()) {
            String[] parts = batteryIdsRaw.split("[,;]");
            List<String> ids = Arrays.stream(parts)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            dto.getBatteryIds().addAll(ids);
        }

        validateDTO(dto);
        return dto;
    }

    private String getColumn(String[] columns, Map<String, Integer> headerIndex, String name, int fallbackIdx) {
        Integer idx = headerIndex.get(name.toLowerCase());
        if (idx != null && idx < columns.length) return unquote(columns[idx]);
        if (fallbackIdx >= 0 && fallbackIdx < columns.length) return unquote(columns[fallbackIdx]);
        return null;
    }

    // small helper unquote
    private static String unquote(String s) {
        if (s == null) return null;
        s = s.trim();
        if (s.startsWith("\"") && s.endsWith("\"") && s.length() >= 2) {
            return s.substring(1, s.length() - 1);
        }
        return s;
    }

    private void validateDTO(VehicleImportDTO dto) {
        List<String> errors = new ArrayList<>();

        // normalize VIN: uppercase, remove non-alphanumeric characters
        String rawVin = dto.getVIN();
        if (rawVin != null) rawVin = rawVin.trim().toUpperCase().replaceAll("[^A-Z0-9]", "");

        if (rawVin == null || rawVin.isEmpty()) {
            errors.add("VIN không được để trống");
        } else {
            // enforce 17-char VIN format
            if (!VIN_PATTERN.matcher(rawVin).matches()) {
                errors.add("VIN không hợp lệ: phải là 17 ký tự chữ in hoa và số (không chứa I,O,Q). Ví dụ: LFVTH1A10N0000337");
            } else if (vehicleRepository.existsByVIN(rawVin)) {
                errors.add("VIN đã tồn tại");
            }
            // set normalized VIN back to dto so saved entity uses canonical form
            dto.setVIN(rawVin);
        }

        try {
            Vehicle.VehicleType.valueOf(dto.getVehicleType());
        } catch (Exception e) {
            errors.add("Loại xe không hợp lệ");
        }

        try {
            Vehicle.BatteryType.valueOf(dto.getBatteryType());
        } catch (Exception e) {
            errors.add("Loại pin không hợp lệ");
        }

        if (dto.getLicensePlate() != null && !dto.getLicensePlate().isEmpty()) {
            if (vehicleRepository.existsByLicensePlate(dto.getLicensePlate())) {
                errors.add("Biển số xe đã tồn tại");
            }
        }

        if (dto.getBatteryCount() == null || dto.getBatteryCount() < 1) {
            errors.add("Số lượng pin phải >= 1");
        }

        if (dto.getManufactureDate() != null && !dto.getManufactureDate().isEmpty()) {
            try {
                parseFlexibleDate(dto.getManufactureDate());
            } catch (DateTimeParseException e) {
                errors.add("Ngày sản xuất không hợp lệ. Chấp nhận: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY");
            }
        }

        if (dto.getPurchaseDate() != null && !dto.getPurchaseDate().isEmpty()) {
            try {
                parseFlexibleDate(dto.getPurchaseDate());
            } catch (DateTimeParseException e) {
                errors.add("Ngày mua không hợp lệ. Chấp nhận: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY");
            }
        }

        // validate battery ids existence if provided
        if (dto.getBatteryIds() != null && !dto.getBatteryIds().isEmpty()) {
            for (String bid : dto.getBatteryIds()) {
                if (batteryRepository.findById(bid).isEmpty()) {
                    errors.add("BatteryId not found: " + bid);
                }
            }
            // if battery count provided, ensure length matches
            if (dto.getBatteryCount() != null && dto.getBatteryCount() != dto.getBatteryIds().size()) {
                errors.add("batteryCount không khớp với số battery_ids cung cấp");
            }
        }

        dto.setErrors(errors);
    }

    private VehicleImportResultDTO processImport(List<VehicleImportDTO> dtos) {
        int successCount = 0;
        int failureCount = 0;
        List<VehicleImportErrorDTO> errors = new ArrayList<>();

        List<Vehicle> vehiclesToSave = new ArrayList<>();
        List<Runnable> postSaveActions = new ArrayList<>();

        for (int i = 0; i < dtos.size(); i++) {
            VehicleImportDTO dto = dtos.get(i);
            int rowNumber = i + 2;

            if (dto == null) {
                failureCount++;
                errors.add(VehicleImportErrorDTO.builder().row(rowNumber).errors(List.of("Empty row parsed")).build());
                continue;
            }

            if (!dto.isValid()) {
                failureCount++;
                errors.add(VehicleImportErrorDTO.builder()
                        .row(rowNumber)
                        .VIN(dto.getVIN())
                        .licensePlate(dto.getLicensePlate())
                        .errors(dto.getErrors())
                        .build());
                continue;
            }

            try {
                log.debug("Preparing to save vehicle from row {}: VIN={}, license={}, type={}, batteryCount={}", rowNumber, dto.getVIN(), dto.getLicensePlate(), dto.getVehicleType(), dto.getBatteryCount());
                 Vehicle vehicle = new Vehicle();
                 vehicle.setVIN(dto.getVIN());
                 vehicle.setVehicleType(Vehicle.VehicleType.valueOf(dto.getVehicleType()));
                 vehicle.setBatteryType(Vehicle.BatteryType.valueOf(dto.getBatteryType()));
                 vehicle.setUser(null); // Xe chưa liên kết với user nào
                 vehicle.setOwnerName(dto.getOwnerName());
                 vehicle.setLicensePlate(dto.getLicensePlate());
                 vehicle.setColor(dto.getColor());
                 vehicle.setBatteryCount(dto.getBatteryCount());

                 if (dto.getManufactureDate() != null && !dto.getManufactureDate().isEmpty()) {
                     vehicle.setManufactureDate(parseFlexibleDate(dto.getManufactureDate()));
                 }

                 if (dto.getPurchaseDate() != null && !dto.getPurchaseDate().isEmpty()) {
                     vehicle.setPurchaseDate(parseFlexibleDate(dto.getPurchaseDate()));
                 }

                 vehicle.setActive(false); // Mặc định false - xe chưa được kích hoạt

                 vehiclesToSave.add(vehicle);

                 // prepare post-save action to create VehicleBattery entries with saved vehicle id
                 if (dto.getBatteryIds() != null && !dto.getBatteryIds().isEmpty()) {
                     List<String> batteryIds = new ArrayList<>(dto.getBatteryIds());
                     postSaveActions.add(() -> {
                         // find saved vehicle by VIN (should exist now)
                         vehicleRepository.findByVIN(dto.getVIN()).ifPresent(saved -> {
                             // attach batteries
                             for (int idx = 0; idx < batteryIds.size(); idx++) {
                                 String bid = batteryIds.get(idx);
                                 Optional<Battery> optB = batteryRepository.findById(bid);
                                 if (optB.isPresent()) {
                                     Battery b = optB.get();
                                     VehicleBattery vb = new VehicleBattery();
                                     vb.setVehicle(saved);
                                     vb.setBattery(b);
                                     vb.setAttachTime(LocalDateTime.now());
                                     vb.setActive(true);
                                     vb.setPrimary(idx == 0);
                                     vehicleBatteryRepository.save(vb);

                                     // also set battery.vehicle field for consistency
                                     b.setVehicle(saved);
                                     batteryRepository.save(b);
                                 } else {
                                     log.warn("Battery id {} not found when attaching to vehicle VIN={}", bid, dto.getVIN());
                                 }
                             }
                         });
                     });
                 }

                 successCount++;

            } catch (Exception e) {
                failureCount++;
                errors.add(VehicleImportErrorDTO.builder()
                        .row(rowNumber)
                        .VIN(dto.getVIN())
                        .licensePlate(dto.getLicensePlate())
                        .errors(List.of(e.getMessage()))
                        .build());
            }
        }

        // save vehicles in batch
        if (!vehiclesToSave.isEmpty()) {
            log.info("Saving {} vehicles (VINs: {})", vehiclesToSave.size(), vehiclesToSave.stream().map(Vehicle::getVIN).toList());
            try {
                vehicleRepository.saveAll(vehiclesToSave);
                log.info("Saved vehicles to DB");
                // verify save by fetching VINs
                List<String> vins = vehiclesToSave.stream().map(Vehicle::getVIN).toList();
                List<Vehicle> fromDb = vehicleRepository.findAllByVINs(vins);
                log.info("After save, found {} vehicles in DB for VINs provided", fromDb.size());
            } catch (Exception e) {
                log.error("Error saving vehicles: {}", e.getMessage(), e);
                // convert error to failures
                for (Vehicle v : vehiclesToSave) {
                    failureCount++;
                    errors.add(VehicleImportErrorDTO.builder()
                            .row(-1)
                            .VIN(v.getVIN())
                            .licensePlate(v.getLicensePlate())
                            .errors(List.of("Save error: " + e.getMessage()))
                            .build());
                }
            }
        }

        // execute post-save actions (create vehicle-battery links)
        for (Runnable r : postSaveActions) {
            try { r.run(); } catch (Exception ex) { log.warn("Error creating vehicleBattery: {}", ex.getMessage()); }
        }

        return VehicleImportResultDTO.builder()
                .totalRows(dtos.size())
                .successCount(successCount)
                .failureCount(failureCount)
                .errors(errors)
                .build();
    }

    private boolean isCSVFile(MultipartFile file) {
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();
        // accept common CSV content types as well as files uploaded via browsers
        return (contentType != null && (contentType.equals("text/csv") || contentType.equals("application/vnd.ms-excel") || contentType.contains("csv"))) ||
                (filename != null && filename.toLowerCase().endsWith(".csv"));
    }

    private Integer parseSafeInteger(String value) {
        if (value == null || value.isEmpty()) return 1;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }


    private LocalDate parseFlexibleDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }

        dateStr = dateStr.trim();

        // Danh sách các format ngày được chấp nhận
        DateTimeFormatter[] formatters = {
                DateTimeFormatter.ofPattern("yyyy-MM-dd"),     // 2023-05-15
                DateTimeFormatter.ofPattern("yyyy/MM/dd"),     // 2023/05/15
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),     // 15/05/2023 (Excel mặc định)
                DateTimeFormatter.ofPattern("dd-MM-yyyy"),     // 15-05-2023
                DateTimeFormatter.ofPattern("d/M/yyyy"),       // 5/5/2023 (không có leading zero)
                DateTimeFormatter.ofPattern("d-M-yyyy")        // 5-5-2023
        };

        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(dateStr, formatter);
            } catch (DateTimeParseException e) {
                // Thử format tiếp theo
            }
        }

        throw new DateTimeParseException("Không thể parse ngày: " + dateStr, dateStr, 0);
    }
}
