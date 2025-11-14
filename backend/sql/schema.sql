CREATE DATABASE IF NOT EXISTS employee_info;
USE employee_info;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(60) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO users (username, password_hash, role)
VALUES ('99admin', '$2b$10$jWcy.L9OaG3FCpQU2gqKeOGADsFnv2KUXrnVya7oIf16ngLRs00kO', 'admin')
ON DUPLICATE KEY UPDATE role = VALUES(role);

CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  birthday DATE NOT NULL,
  address VARCHAR(255) NULL,
  age INT NOT NULL,
  department VARCHAR(120) NOT NULL,
  gender ENUM('Male','Female') NOT NULL DEFAULT 'Male',
  phone VARCHAR(40) NULL,
  hire_date DATE,
  status ENUM('Active', 'On Leave') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_department (department)
);

INSERT INTO employees (name, birthday, address, age, department, gender, phone, hire_date, status) VALUES
('Grace Hopper', '1985-12-09', '42 Silicon Ave, Arlington', 39, 'ဖဲရွေး', 'Female', '+1 202 555 0142', '2014-03-12', 'Active'),
('Guido van Rossum', '1965-01-31', 'Delphi Centrum, Amsterdam', 59, 'စူပါ', 'Male', '+31 20 555 2222', '2005-09-09', 'Active'),
('James Gosling', '1955-05-19', 'Calgary, Canada', 69, 'ဖဲရွေး', 'Male', '+1 403 555 7733', '2000-03-14', 'On Leave'),
('Katherine Johnson', '1986-08-26', '12 Calculation Ct, White Sulphur Springs', 38, 'CQ', 'Female', '+1 304 555 7788', '2013-04-23', 'Active'),
('Margaret Hamilton', '1983-08-17', '11 Apollo St, Houston', 41, 'ဖဲရွေး', 'Female', '+1 713 555 9011', '2012-02-19', 'Active'),
('ခိုင်ဇင်ဦး', '2002-07-21', '221B Baker Street, London', 35, 'ဖဲဝေ', 'Female', '+44 1234 567890', '2015-06-15', 'Active'),
('ငြိမ်းချမ်းကို', '1992-11-09', '8 Frequency Dr, Vienna', 32, 'စားဖိုချောင်', 'Male', '+43 1 555 2121', '2018-10-10', 'Active'),
('စည်သူ', '1969-08-28', 'Menlo Park, CA', 55, 'CC', 'Male', '+1 650 555 6245', '2007-04-17', 'Active'),
('ဇင်ပိုပို', '1955-06-08', 'Oxford, UK', 69, 'ဖဲဝေ', 'Female', '+44 20 555 4040', '2001-12-01', 'Active'),
('သူရိန်ထွန်း', '1987-06-23', '17 Enigma Rd, Manchester', 37, 'စာရင်းစစ်', 'Male', '+44 161 555 0110', '2016-09-01', 'Active'),
('မိုးမင်းသူ', '1990-04-11', 'Nay Pyi Taw', 34, 'သန့်ရှင်းရေး', 'Female', '+95 9 777 123456', '2017-05-20', 'Active');
