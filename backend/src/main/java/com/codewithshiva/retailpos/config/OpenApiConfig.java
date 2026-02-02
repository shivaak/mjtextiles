package com.codewithshiva.retailpos.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Value("${app.company.name}")
    private String companyName;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title(companyName + " Retail POS API")
                .version("1.0.0")
                .description("REST API for " + companyName + " Retail Point of Sale System")
                .contact(new Contact()
                    .name(companyName)
                )
            );
    }
}
