-- Username: 'doctor'
-- Password: 'Oces2023@'

INSERT INTO users 
(email, username, password_hash, role, phone_number, is_verified, phone_verified, status, last_login_at, created_at, updated_at)
VALUES 
('doctor@gmail.com', 'doctor', '$2y$10$f2KnQsrCZQ/LRJeEy9kbjeuRBqmSmWwAqfC66BgyE5hf13EIMoixq', 'doctor', '1234567890', TRUE, TRUE, 'active', NOW(), NOW(), NOW());