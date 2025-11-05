package BatterySwapStation.service;

import BatterySwapStation.dto.VehicleImportDTO;
import BatterySwapStation.dto.VehicleImportErrorDTO;
import BatterySwapStation.dto.VehicleImportResultDTO;
import BatterySwapStation.entity.User;
import BatterySwapStation.entity.Vehicle;
import BatterySwapStation.repository.UserRepository;
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
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleImportService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

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

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();

            if (headerLine == null) {
                throw new IllegalArgumentException("File CSV rỗng");
            }

            String line;
            int rowNumber = 1;

            while ((line = reader.readLine()) != null) {
                rowNumber++;

                if (line.trim().isEmpty()) {
                    continue;
                }

                try {
                    VehicleImportDTO dto = parseCSVLine(line, rowNumber);
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

        return vehicles;
    }

    private VehicleImportDTO parseCSVLine(String line, int rowNumber) {
        String[] columns = line.split(",", -1);

        if (columns.length < 8) {
            return VehicleImportDTO.builder()
                    .errors(List.of("Thiếu cột dữ liệu (cần 8 cột)"))
                    .build();
        }

        VehicleImportDTO dto = VehicleImportDTO.builder()
                .VIN(columns[0].trim())
                .vehicleType(columns[1].trim())
                .batteryType(columns[2].trim())
                .ownerName(columns[3].trim())
                .licensePlate(columns[4].trim())
                .color(columns[5].trim())
                .batteryCount(parseSafeInteger(columns[6].trim()))
                .manufactureDate(columns[7].trim())
                .purchaseDate(columns.length > 8 ? columns[8].trim() : "")
                .userId(null) // Không cho phép nhập userId từ CSV
                .isActive(false) // Mặc định false - xe chưa được kích hoạt
                .build();

        validateDTO(dto);
        return dto;
    }

    private void validateDTO(VehicleImportDTO dto) {
        List<String> errors = new ArrayList<>();

        if (dto.getVIN() == null || dto.getVIN().isEmpty()) {
            errors.add("VIN không được để trống");
        } else if (vehicleRepository.existsByVIN(dto.getVIN())) {
            errors.add("VIN đã tồn tại");
        }

        try {
            Vehicle.VehicleType.valueOf(dto.getVehicleType());
        } catch (IllegalArgumentException e) {
            errors.add("Loại xe không hợp lệ");
        }

        try {
            Vehicle.BatteryType.valueOf(dto.getBatteryType());
        } catch (IllegalArgumentException e) {
            errors.add("Loại pin không hợp lệ");
        }

        // userId không cần validate vì xe import chưa liên kết với user

        if (dto.getLicensePlate() != null && !dto.getLicensePlate().isEmpty()) {
            if (vehicleRepository.existsByLicensePlate(dto.getLicensePlate())) {
                errors.add("Biển số xe đã tồn tại");
            }
        }

        if (dto.getBatteryCount() == null || dto.getBatteryCount() < 1) {
            errors.add("Số lượng pin phải >= 1");
        }

        // Validate manufacture date với nhiều format
        if (dto.getManufactureDate() != null && !dto.getManufactureDate().isEmpty()) {
            try {
                parseFlexibleDate(dto.getManufactureDate());
            } catch (DateTimeParseException e) {
                errors.add("Ngày sản xuất không hợp lệ. Chấp nhận: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY");
            }
        }

        // Validate purchase date với nhiều format
        if (dto.getPurchaseDate() != null && !dto.getPurchaseDate().isEmpty()) {
            try {
                parseFlexibleDate(dto.getPurchaseDate());
            } catch (DateTimeParseException e) {
                errors.add("Ngày mua không hợp lệ. Chấp nhận: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY");
            }
        }

        dto.setErrors(errors);
    }

    private VehicleImportResultDTO processImport(List<VehicleImportDTO> dtos) {
        int successCount = 0;
        int failureCount = 0;
        List<VehicleImportErrorDTO> errors = new ArrayList<>();

        List<Vehicle> vehiclesToSave = new ArrayList<>();

        for (int i = 0; i < dtos.size(); i++) {
            VehicleImportDTO dto = dtos.get(i);
            int rowNumber = i + 2;

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

        if (!vehiclesToSave.isEmpty()) {
            vehicleRepository.saveAll(vehiclesToSave);
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
        return (contentType != null && contentType.equals("text/csv")) ||
               (filename != null && filename.endsWith(".csv"));
    }

    private Integer parseSafeInteger(String value) {
        if (value == null || value.isEmpty()) return 1;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Boolean parseSafeBoolean(String value) {
        if (value == null || value.isEmpty()) return false;
        return Boolean.parseBoolean(value);
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
