CREATE TABLE recurring_expenses (
    id            BIGINT         NOT NULL AUTO_INCREMENT,
    uuid          VARCHAR(36)    NOT NULL,
    family_uuid   VARCHAR(36)    NOT NULL,
    category_uuid VARCHAR(36)    NOT NULL,
    user_uuid     VARCHAR(36)    NOT NULL,
    name          VARCHAR(100)   NOT NULL,
    amount        DECIMAL(12, 2) NOT NULL,
    day_of_month  TINYINT        NOT NULL,
    status        VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
    created_at    DATETIME(3)    NOT NULL,
    updated_at    DATETIME(3)    NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_recurring_uuid (uuid),
    CONSTRAINT fk_recurring_family FOREIGN KEY (family_uuid) REFERENCES families (uuid),
    INDEX idx_recurring_family_uuid (family_uuid),
    INDEX idx_recurring_day (day_of_month)
);
