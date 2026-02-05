# Use Eclipse Temurin JRE 17 Alpine for minimal image size
FROM eclipse-temurin:17-jre-alpine

# Set working directory
WORKDIR /app

# Copy the built JAR file from target directory
COPY target/backend-0.0.1-SNAPSHOT.jar app.jar

# Expose the port that Spring Boot runs on (default 8080)
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
