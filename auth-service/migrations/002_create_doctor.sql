INSERT INTO users 
(email, username, password_hash, role, phone_number, is_verified, phone_verified, status, last_login_at, created_at, updated_at)
VALUES 
('doctor@gmail.com', 'doctor', '$2a$10$ANjR3bLxsu4S998RZgs6Ve8ItK7gBcoe2HKy5Bf2Hbc0jaoVmXJ.S', 'doctor', '1234567890', TRUE, TRUE, 'active', NOW(), NOW(), NOW());