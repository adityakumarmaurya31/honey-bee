USE honeybee;
DELETE FROM users WHERE email='admin@honeybee.com';
INSERT INTO users (name, email, password, role) 
VALUES ('Admin User', 'admin@honeybee.com', '$2b$10$LPuDcgTkh6FrXs2celOsveCKlHAYEx8ksnwBuuOiBEJ8iMZrOQSc2', 'admin');
