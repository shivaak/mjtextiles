# Use Eclipse Temurin JDK 21 for linux/amd64 platform
FROM --platform=linux/amd64 eclipse-temurin:21-jdk

# Set working directory
WORKDIR /app

# Copy the built JAR file from target directory
COPY target/backend-0.0.1-SNAPSHOT.jar app.jar

# Expose the port that Spring Boot runs on (default 8080)
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
