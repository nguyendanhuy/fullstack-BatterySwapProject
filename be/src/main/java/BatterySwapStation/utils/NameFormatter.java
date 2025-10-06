package BatterySwapStation.utils;

public class NameFormatter {


    public static String formatFullName(String name) {
        if (name == null || name.isBlank()) {
            return name;
        }
        String normalized = name.trim().toLowerCase();


        StringBuilder result = new StringBuilder();
        for (String word : normalized.split("\\s+")) {
            if (!word.isEmpty()) {
                result.append(Character.toUpperCase(word.charAt(0)))
                        .append(word.substring(1))
                        .append(" ");
            }
        }

        return result.toString().trim();
    }
}
