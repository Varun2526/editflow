# Production image for Render (Render has no native Java runtime). Local development doesn't need Docker.
# Build:  docker build -t editflow-api backend
# Run:    docker run -p 8081:8081 --env-file prod.env editflow-api

# ---- build ----
FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src src
RUN mvn -B -q package -DskipTests && cp target/editflow-backend-*.jar app.jar

# ---- run ----
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S editflow && adduser -S editflow -G editflow
WORKDIR /app
COPY --from=build /build/app.jar app.jar
USER editflow

# `prod` is baked in so a missing env var can never fall back to the local profile.
# Memory flags keep the JVM inside a 512 MB container (Render free tier).
ENV SPRING_PROFILES_ACTIVE=prod \
    PORT=8081 \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Xss512k -XX:+ExitOnOutOfMemoryError"
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
