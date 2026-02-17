CREATE DATABASE FeedingProgram;
USE FeedingProgram;

CREATE TABLE tblTeachers (
    teacher_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    Password VARCHAR(255),
    mobile_no VARCHAR(255),
    school_name VARCHAR(255),
    is_first_login boolean
) AUTO_INCREMENT = 101;

CREATE TABLE tblStudents (
	student_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    sex ENUM('M','F') NOT NULL,
    age INT, 
    grade_level INT,
    section_id VARCHAR(255),
    section_name VARCHAR(255),
    height_cm INT,
    weight_kg INT,
    bmi JSON,
    bmi_measurement JSON,
    measurement_date JSON,
    program_attendance JSON,
    teacher_id INT,
    school_name VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) AUTO_INCREMENT = 1001;

CREATE TABLE tblSections (
	section_id VARCHAR(255) NOT NULL PRIMARY KEY,
    section_name VARCHAR(255),
    grade_level INT,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)
ALTER TABLE tblSections
  ADD COLUMN section_seq INT NOT NULL,
  ADD COLUMN teacher_id VARCHAR(255) NOT NULL;


CREATE TABLE tblSessions (
	session_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT,
    session_date DATE,
    status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    participating_section JSON,
    sponsors VARCHAR(255),
    foods_serve VARCHAR(255),

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) AUTO_INCREMENT = 51001;

CREATE TABLE tblAttendance (
  student_id INT,
  session_id INT,
  section_id VARCHAR(255),
  present TINYINT,
  remarks VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);




-- DROP TABLE tblStudents
ALTER TABLE tblTeachers
-- ALTER TABLE tblStudents
ADD COLUMN school_name VARCHAR(255);
TRUNCATE tblStudents

-- DELETE COLUMN
ALTER TABLE tblSections
DROP COLUMN section_seq

-- SAMPLE DATA INSERT
INSERT INTO tblTeachers (first_name, last_name, email, mobile_no, Password, is_first_login) VALUES ("Nikka Noreine", "Reyes", "reimarkable@gmail.com", "09498112655", "123", True);
INSERT INTO tblTeachers (first_name, last_name, email, mobile_no, Password, is_first_login) VALUES ("Jeleazar", "Pacolor", "jepacolor.f@gmail.com", "09498112655", "123", True);
INSERT INTO tblSessions (teacher_id, session_date, status, participating_section, sponsors, foods_serve) VALUES (101, '2026-01-15', "pending", '["101_Reyes_2001"]', "Barangay Chairman", "Spaghetti");
INSERT INTO tblStudents
(
  first_name,
  last_name,
  sex,
  age,
  grade_level,
  section_id,
  section_name,
  height_cm,
  weight_KG,
  bmi,
  bmi_measurement,
  measurement_date,
  program_attendance,
  teacher_id
)
VALUES
('Ava','Santos','F',6,0,'101_Reyes_2001','Section A',118,18,JSON_ARRAY(12.9),JSON_ARRAY('Underweight'),JSON_ARRAY('2026-02-02'),NULL,101),
('Liam','Cruz','M',6,0,'101_Reyes_2001','Section A',120,20,JSON_ARRAY(13.9),JSON_ARRAY('Normal'),JSON_ARRAY('2026-02-02'),NULL,101),
('Mia','Garcia','F',6,0,'101_Reyes_2001','Section A',116,20,JSON_ARRAY(14.9),JSON_ARRAY('Normal'),JSON_ARRAY('2026-02-02'),NULL,101),
('Noah','Reyes','M',6,0,'101_Reyes_2001','Section A',119,27,JSON_ARRAY(19.1),JSON_ARRAY('Overweight'),JSON_ARRAY('2026-02-02'),NULL,101),
('Ella','Flores','F',6,0,'101_Reyes_2001','Section A',117,18,JSON_ARRAY(13.1),JSON_ARRAY('Underweight'),JSON_ARRAY('2026-02-02'),NULL,101),

('Ethan','Dela Cruz','M',7,0,'101_Reyes_2001','Section A',124,22,JSON_ARRAY(14.3),JSON_ARRAY('Normal'),JSON_ARRAY('2026-02-02'),NULL,101),
('Sofia','Mendoza','F',7,0,'101_Reyes_2001','Section A',122,21,JSON_ARRAY(14.1),JSON_ARRAY('Normal'),JSON_ARRAY('2026-02-02'),NULL,101),
('Lucas','Ramos','M',7,0,'101_Reyes_2001','Section A',125,30,JSON_ARRAY(19.2),JSON_ARRAY('Overweight'),JSON_ARRAY('2026-02-02'),NULL,101),
('Chloe','Torres','F',7,0,'101_Reyes_2001','Section A',121,18,JSON_ARRAY(12.3),JSON_ARRAY('Underweight'),JSON_ARRAY('2026-02-02'),NULL,101),
('Jacob','Navarro','M',7,0,'101_Reyes_2001','Section A',123,26,JSON_ARRAY(17.2),JSON_ARRAY('Overweight'),JSON_ARRAY('2026-02-02'),NULL,101),

('Isla','Villanueva','F',8,0,'101_Reyes_2001','Section A',128,24,JSON_ARRAY(14.6),JSON_ARRAY('Normal'),JSON_ARRAY('2026-02-02'),NULL,101),
('Benjamin','Castillo','M',8,0,'101_Reyes_2001','Section A',130,24,JSON_ARRAY(14.2),JSON_ARRAY('Normal'),JSON_ARRAY('2026-02-02'),NULL,101),
('Grace','Morales','F',8,0,'101_Reyes_2001','Section A',127,20,JSON_ARRAY(12.4),JSON_ARRAY('Underweight'),JSON_ARRAY('2026-02-02'),NULL,101),
('Henry','Aquino','M',8,0,'101_Reyes_2001','Section A',129,33,JSON_ARRAY(19.8),JSON_ARRAY('Overweight'),JSON_ARRAY('2026-02-02'),NULL,101),
('Zoe','Bautista','F',8,0,'101_Reyes_2001','Section A',126,28,JSON_ARRAY(17.6),JSON_ARRAY('Overweight'),JSON_ARRAY('2026-02-02'),NULL,101),

('Oliver','Domingo','M',7,0,'101_Reyes_2001','Section A',120,16,JSON_ARRAY(11.1),JSON_ARRAY('Underweight'),JSON_ARRAY('2026-02-02'),NULL,101),
('Amelia','Pascual','F',7,0,'101_Reyes_2001','Section A',123,23,JSON_ARRAY(15.2),JSON_ARRAY('Normal'),JSON_ARRAY('2026-02-02'),NULL,101),
('Mateo','Padilla','M',6,0,'101_Reyes_2001','Section A',115,24,JSON_ARRAY(18.1),JSON_ARRAY('Overweight'),JSON_ARRAY('2026-02-02'),NULL,101),
('Harper','Lim','F',6,0,'101_Reyes_2001','Section A',119,21,JSON_ARRAY(14.8),JSON_ARRAY('Normal'),JSON_ARRAY('2026-02-02'),NULL,101),
('Samuel','Chua','M',8,0,'101_Reyes_2001','Section A',131,19,JSON_ARRAY(11.1),JSON_ARRAY('Underweight',JSON_ARRAY('2026-02-02'),NULL,101);


SELECT (CURRENT_DATE)
UPDATE tblStudents
SET
  bmi = JSON_ARRAY_APPEND(COALESCE(bmi, JSON_ARRAY()), '$', CAST(18.2 AS DECIMAL(4,1))),
  measurement_date = JSON_ARRAY_APPEND(COALESCE(measurement_date, JSON_ARRAY()), '$', CURRENT_DATE)
WHERE student_id = 1001;

DELETE FROM tblStudents
WHERE student_id = 1021


UPDATE tblteachers
SET is_first_login = 1 
WHERE teacher_id = 101

UPDATE tblStudents
SET bmi_measurement = JSON_REPLACE(
  bmi_measurement,
  CONCAT('$[', JSON_LENGTH(bmi_measurement) - 1, ']'),
  'underweight'
)
WHERE JSON_LENGTH(bmi_measurement) > 0
  AND JSON_UNQUOTE(JSON_EXTRACT(bmi_measurement, CONCAT('$[', JSON_LENGTH(bmi_measurement) - 1, ']'))) = 'uunderweight';

SELECT * FROM tblteachers
SELECT * FROM tblStudents
WHERE student_id = 1001
SELECT * FROM tblStudents
SELECT * FROM tblSections
SELECT * FROM tblSessions
SELECT * FROM tblAttendance





-- SECTIONS SEQUENCE
WITH ordered AS (
  SELECT section_id,
         ROW_NUMBER() OVER (ORDER BY created_at, section_id) AS rn
  FROM tblSections
)
UPDATE tblSections t
JOIN ordered o ON o.section_id = t.section_id
SET t.section_seq = 2000 + o.rn;

ALTER TABLE tblSections
  ALTER COLUMN section_seq DROP DEFAULT,
  ALTER COLUMN teacher_id DROP DEFAULT;



SELECT VERSION();



SELECT s.*, 
	EXISTS(SELECT 1 FROM tblAttendance a WHERE a.session_id = s.session_id) AS attendance_taken 
FROM tblSessions s WHERE s.teacher_id = 101








UPDATE tblStudents
	SET
		height_cm = %s,
		weight_kg = %s,
		bmi = CASE
			WHEN JSON_LENGTH(COALESCE(measurement_date, JSON_ARRAY())) > 0
				AND DATE(
					JSON_UNQUOTE(
						JSON_EXTRACT(
							COALESCE(measurement_date, JSON_ARRAY()),
							CONCAT('$[', JSON_LENGTH(COALESCE(measurement_date, JSON_ARRAY())) - 1, ']')
						)
					)
				) = CURRENT_DATE
			THEN JSON_REPLACE(
				CASE
					WHEN JSON_VALID(COALESCE(bmi, JSON_ARRAY())) THEN COALESCE(bmi, JSON_ARRAY())
					ELSE JSON_ARRAY()
				END,
				CONCAT('$[', JSON_LENGTH(CASE
					WHEN JSON_VALID(COALESCE(bmi, JSON_ARRAY())) THEN COALESCE(bmi, JSON_ARRAY())
					ELSE JSON_ARRAY()
				END) - 1, ']'),
				CAST(%s AS DECIMAL(4,1))
			)
			ELSE JSON_ARRAY_APPEND(
				CASE
					WHEN JSON_VALID(COALESCE(bmi, JSON_ARRAY())) THEN COALESCE(bmi, JSON_ARRAY())
					ELSE JSON_ARRAY()
				END,
				'$',
				CAST(%s AS DECIMAL(4,1))
			)
		END,
		bmi_measurement = CASE
			WHEN JSON_LENGTH(COALESCE(measurement_date, JSON_ARRAY())) > 0
				AND DATE(
					JSON_UNQUOTE(
						JSON_EXTRACT(
							COALESCE(measurement_date, JSON_ARRAY()),
							CONCAT('$[', JSON_LENGTH(COALESCE(measurement_date, JSON_ARRAY())) - 1, ']')
						)
					)
				) = CURRENT_DATE
			THEN JSON_REPLACE(
				CASE
					WHEN JSON_VALID(COALESCE(bmi_measurement, JSON_ARRAY())) THEN COALESCE(bmi_measurement, JSON_ARRAY())
					ELSE JSON_ARRAY()
				END,
				CONCAT('$[', JSON_LENGTH(CASE
					WHEN JSON_VALID(COALESCE(bmi_measurement, JSON_ARRAY())) THEN COALESCE(bmi_measurement, JSON_ARRAY())
					ELSE JSON_ARRAY()
				END) - 1, ']'),
				JSON_QUOTE(%s)
			)
			ELSE JSON_ARRAY_APPEND(
				CASE
					WHEN JSON_VALID(COALESCE(bmi_measurement, JSON_ARRAY())) THEN COALESCE(bmi_measurement, JSON_ARRAY())
					ELSE JSON_ARRAY()
				END,
				'$',
				JSON_QUOTE(%s)
			)
		END,
		measurement_date = CASE
			WHEN JSON_LENGTH(COALESCE(measurement_date, JSON_ARRAY())) > 0
				AND DATE(
					JSON_UNQUOTE(
						JSON_EXTRACT(
							COALESCE(measurement_date, JSON_ARRAY()),
							CONCAT('$[', JSON_LENGTH(COALESCE(measurement_date, JSON_ARRAY())) - 1, ']')
						)
					)
				) = CURRENT_DATE
			THEN measurement_date
			ELSE JSON_ARRAY_APPEND(
				COALESCE(measurement_date, JSON_ARRAY()),
				'$',
				CURRENT_DATE
			)
		END
	WHERE student_id=%s AND teacher_id=%s




