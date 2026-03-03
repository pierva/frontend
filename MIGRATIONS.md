# New updates for production modules

## Manual SQL Changes in DB for V2

### Step 1
Update IngredientLotCode table to support multiple ingredient lot codes. Execute the below update in the database

```
ALTER TABLE IngredientLotCodes
  MODIFY ingredientLotCode varchar(255) NULL,
  ADD COLUMN status ENUM('MISSING','COMPLETE','NOT_USED','REMOVED') NOT NULL DEFAULT 'MISSING' AFTER ingredientLotCode,
  ADD COLUMN quantityUsed DECIMAL(10,3) NULL AFTER status;
```

### Step2 
Mark existing rows as COMPLETE so old data isn’t “missing”

```
<!-- Only necessary if not able to update in safe mode -->
<!-- SET SQL_SAFE_UPDATES = 0; -->

  UPDATE IngredientLotCodes
  SET status = 'COMPLETE'
  WHERE ingredientLotCode IS NOT NULL;

<!-- Reinstate safe mode if previously removed -->
<!-- SET SQL_SAFE_UPDATES = 1; -->

```
### Step 3
Check for duplicates
```
SELECT batchId, ingredientId, COUNT(*) AS cnt
FROM IngredientLotCodes
GROUP BY batchId, ingredientId
HAVING cnt > 1;
```

```
SELECT *
FROM IngredientLotCodes
WHERE (batchId, ingredientId) IN (
  SELECT batchId, ingredientId
  FROM IngredientLotCodes
  GROUP BY batchId, ingredientId
  HAVING COUNT(*) > 1
)
ORDER BY batchId, ingredientId, id;

```
Export these result as rollback evidence in case of failure

### Step 4
Create backup for the IngredientLotCodes table or export from WorkBench
```
CREATE TABLE IngredientLotCodes_backup_20260219 AS
SELECT * FROM IngredientLotCodes;

```

### Step 5

If there are duplicates remove them keeping the lowest IDs entries

```
DELETE ilc
FROM IngredientLotCodes ilc
JOIN (
  SELECT batchId, ingredientId, MIN(id) AS keep_id
  FROM IngredientLotCodes
  GROUP BY batchId, ingredientId
  HAVING COUNT(*) > 1
) d
  ON d.batchId = ilc.batchId
 AND d.ingredientId = ilc.ingredientId
WHERE ilc.id <> d.keep_id;

```

### Step 6
Confirm no duplicates remains

```
SELECT batchId, ingredientId, COUNT(*) AS cnt
FROM IngredientLotCodes
GROUP BY batchId, ingredientId
HAVING cnt > 1;

```

### Step 7
Add uniqueness so you keep “one parent line per ingredient per batch

```
ALTER TABLE IngredientLotCodes
  ADD UNIQUE KEY uq_batch_ingredient (batchId, ingredientId);

```

### Step 8
Allow for null then we correct status by adding a label (MISSING)

```
ALTER TABLE IngredientLotCodes
  MODIFY ingredientLotCode varchar(255) NULL;
```

```
ALTER TABLE IngredientLotCodes
  ADD COLUMN status ENUM('MISSING','ENTERED','EXCLUDED') NOT NULL DEFAULT 'MISSING';

```

```
ALTER TABLE IngredientLotCodes
  ADD COLUMN quantityKg DECIMAL(10,3) NULL AFTER ingredientLotCode,
  ADD COLUMN quantityInput DECIMAL(10,3) NULL AFTER quantityKg,
  ADD COLUMN uomInput ENUM('kg','lb') NULL AFTER quantityInput;
```

Convert status to ENTERED for all the rows containing values. Yoy may get the SAFE updates warning, so disable it for this instance with SET SQL_SAFE_UPDATES = 0;, then put it back on with SET SQL_SAFE_UPDATES = 1;
```
UPDATE IngredientLotCodes
SET status = 'EXCLUDED'
WHERE status IS NULL
  AND (quantityKg IS NULL OR quantityKg <= 0);

```

Add check constraint so no zero quantity can be entered for status = ENTERED

```
ALTER TABLE IngredientLotCodes
  ADD CONSTRAINT chk_qty_required_when_entered
  CHECK (
    status <> 'ENTERED'
    OR (quantityKg IS NOT NULL AND quantityKg > 0)
  );
```

## New analytics module (ingredient quantities and prices)

Add quantity to ProductIngredient table
```
ALTER TABLE `ProductIngredients`
  ADD COLUMN `expectedQuantityKg` DECIMAL(10, 3) NULL
  AFTER `ingredientId`;
```

## Deactivate products in the admin product page

```
ALTER TABLE Products ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT true;
```