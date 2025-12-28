-- WVDI PostgreSQL Schema
-- Converted from Laravel MySQL migrations
-- All tables prefixed with w_ to match existing data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Branches table
CREATE TABLE IF NOT EXISTS w_branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone1 VARCHAR(50),
    phone2 VARCHAR(50),
    address1 TEXT,
    address2 TEXT,
    region VARCHAR(100),
    city VARCHAR(100),
    zip_code VARCHAR(20),
    place_id VARCHAR(255),
    permission VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account categories table
CREATE TABLE IF NOT EXISTS w_account_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    parent_id INTEGER,
    list_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table
CREATE TABLE IF NOT EXISTS w_accounts (
    id SERIAL PRIMARY KEY,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    account_category INTEGER REFERENCES w_account_categories(id),
    list_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table
CREATE TABLE IF NOT EXISTS w_contacts (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES w_branches(id),
    contact_type VARCHAR(50),
    company VARCHAR(255),
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    nick_name VARCHAR(100),
    contact_status VARCHAR(50) DEFAULT 'active',
    license_code VARCHAR(100),
    referral_type VARCHAR(100),
    email VARCHAR(255),
    phone1 VARCHAR(50),
    phone2 VARCHAR(50),
    address1 TEXT,
    address2 TEXT,
    region VARCHAR(100),
    city VARCHAR(100),
    zip_code VARCHAR(20),
    photo TEXT,
    gender VARCHAR(20),
    updated_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE IF NOT EXISTS w_services (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES w_branches(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15, 2) DEFAULT 0,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Requisition table
CREATE TABLE IF NOT EXISTS w_requisition (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES w_branches(id),
    contact_id INTEGER REFERENCES w_contacts(id),
    date DATE,
    amount DECIMAL(15, 2) DEFAULT 0,
    memo TEXT,
    status VARCHAR(50) DEFAULT 'Draft',
    approved_by INTEGER,
    approved_date TIMESTAMP,
    paid_by INTEGER,
    paid_date TIMESTAMP,
    disapproved_by INTEGER,
    disapproved_date TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Register table (main financial transactions)
CREATE TABLE IF NOT EXISTS w_register (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES w_branches(id),
    account_id INTEGER REFERENCES w_accounts(id),
    transaction_type VARCHAR(50),
    transfer_account_id INTEGER REFERENCES w_accounts(id),
    transfer_register_id INTEGER,
    flag VARCHAR(50),
    date DATE,
    contact_id INTEGER REFERENCES w_contacts(id),
    payment_method VARCHAR(100),
    category_id INTEGER REFERENCES w_account_categories(id),
    service_id INTEGER REFERENCES w_services(id),
    memo TEXT,
    certificate_no VARCHAR(100),
    amount DECIMAL(15, 2) DEFAULT 0,
    transaction_status CHAR(1) DEFAULT 'U',
    or_number VARCHAR(100),
    "check" VARCHAR(100),
    requisition_id INTEGER REFERENCES w_requisition(id),
    updated_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lookup table
CREATE TABLE IF NOT EXISTS w_lookup (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    list_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_register_account_id ON w_register(account_id);
CREATE INDEX idx_register_branch_id ON w_register(branch_id);
CREATE INDEX idx_register_date ON w_register(date);
CREATE INDEX idx_register_transaction_status ON w_register(transaction_status);
CREATE INDEX idx_contacts_branch_id ON w_contacts(branch_id);
CREATE INDEX idx_requisition_branch_id ON w_requisition(branch_id);
CREATE INDEX idx_lookup_type ON w_lookup(type);
