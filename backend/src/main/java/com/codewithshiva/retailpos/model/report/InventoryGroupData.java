package com.codewithshiva.retailpos.model.report;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.beans.ConstructorProperties;
import java.math.BigDecimal;

/**
 * Model for inventory valuation grouped by category or brand.
 */
@Data
@Builder
@NoArgsConstructor
public class InventoryGroupData {
    private String groupName;
    private Integer skuCount;
    private Long itemCount;
    private BigDecimal costValue;
    private BigDecimal retailValue;

    @ConstructorProperties({"groupName", "skuCount", "itemCount", "costValue", "retailValue"})
    public InventoryGroupData(String groupName, Integer skuCount, Long itemCount, 
                              BigDecimal costValue, BigDecimal retailValue) {
        this.groupName = groupName;
        this.skuCount = skuCount;
        this.itemCount = itemCount;
        this.costValue = costValue;
        this.retailValue = retailValue;
    }
}
