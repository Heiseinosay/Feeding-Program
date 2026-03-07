-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: FeedingProgramTest
-- ------------------------------------------------------
-- Server version	8.0.36

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tblattendance`
--

DROP TABLE IF EXISTS `tblattendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tblattendance` (
  `student_id` int DEFAULT NULL,
  `session_id` int DEFAULT NULL,
  `section_id` varchar(255) DEFAULT NULL,
  `present` tinyint DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblattendance`
--

LOCK TABLES `tblattendance` WRITE;
/*!40000 ALTER TABLE `tblattendance` DISABLE KEYS */;
INSERT INTO `tblattendance` VALUES (1025,51015,'101_Reyes_2004',1,'','2026-02-15 09:32:52'),(1012,51019,'101_Reyes_2001',0,'','2026-02-24 06:40:18'),(1009,51019,'101_Reyes_2001',0,'','2026-02-24 06:40:18'),(1005,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1006,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1013,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1019,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1014,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1011,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1010,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1002,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1008,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1018,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1003,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1023,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1004,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1016,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1024,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1020,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1007,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1021,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1015,51019,'101_Reyes_2001',1,'','2026-02-24 06:40:18'),(1025,51019,'101_Reyes_2004',0,'','2026-02-24 06:40:24');
/*!40000 ALTER TABLE `tblattendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblsections`
--

DROP TABLE IF EXISTS `tblsections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tblsections` (
  `section_id` varchar(255) NOT NULL,
  `section_name` varchar(255) DEFAULT NULL,
  `grade_level` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `section_seq` int NOT NULL,
  `teacher_id` varchar(255) NOT NULL,
  PRIMARY KEY (`section_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblsections`
--

LOCK TABLES `tblsections` WRITE;
/*!40000 ALTER TABLE `tblsections` DISABLE KEYS */;
INSERT INTO `tblsections` VALUES ('101_Reyes_2001','Section A',0,'2026-02-03 02:51:13',2001,'101'),('101_Reyes_2004','Sampaguita',8,'2026-02-03 02:53:03',2004,'101'),('101_Reyes_2005','Empty section',0,'2026-03-07 07:30:27',2005,'101');
/*!40000 ALTER TABLE `tblsections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblsessions`
--

DROP TABLE IF EXISTS `tblsessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tblsessions` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int DEFAULT NULL,
  `session_date` date DEFAULT NULL,
  `status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  `participating_section` json DEFAULT NULL,
  `sponsors` varchar(255) DEFAULT NULL,
  `foods_serve` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=51025 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblsessions`
--

LOCK TABLES `tblsessions` WRITE;
/*!40000 ALTER TABLE `tblsessions` DISABLE KEYS */;
INSERT INTO `tblsessions` VALUES (51015,101,'2026-02-16','completed','[\"101_Reyes_2004\", \"101_Reyes_2001\", \"101_Reyes_2005\"]','PTA','Rice, Boiled egg','2026-02-15 08:48:17','2026-02-16 15:45:57'),(51019,101,'2026-02-23','completed','[\"101_Reyes_2001\", \"101_Reyes_2004\"]','Barangay','Boiled egg','2026-02-16 15:41:49','2026-02-24 06:39:49'),(51021,101,'2026-03-06','pending','[\"101_Reyes_2004\", \"101_Reyes_2006\"]','Barangay','Champorado with tuyo','2026-02-17 07:42:44','2026-02-17 07:42:44');
/*!40000 ALTER TABLE `tblsessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblstudents`
--

DROP TABLE IF EXISTS `tblstudents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tblstudents` (
  `student_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `sex` enum('M','F') NOT NULL,
  `age` int DEFAULT NULL,
  `grade_level` int DEFAULT NULL,
  `section_id` varchar(255) DEFAULT NULL,
  `section_name` varchar(255) DEFAULT NULL,
  `height_cm` int DEFAULT NULL,
  `weight_kg` int DEFAULT NULL,
  `bmi` json DEFAULT NULL,
  `bmi_measurement` json DEFAULT NULL,
  `measurement_date` json DEFAULT NULL,
  `program_attendance` json DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `school_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1034 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblstudents`
--

LOCK TABLES `tblstudents` WRITE;
/*!40000 ALTER TABLE `tblstudents` DISABLE KEYS */;
INSERT INTO `tblstudents` VALUES (1002,'Liam','Cruz','M',6,0,'101_Reyes_2001','Section A',120,30,'[13.9, 13.9, 38.2, 20.8]','[\"normal\", \"underweight\", \"overweight\", \"normal\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1003,'Mia','Garcia','F',6,0,'101_Reyes_2001','Section A',116,21,'[14.9, 14.9, 14.9, 15.6]','[\"normal\", \"underweight\", \"underweight\", \"underweight\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1004,'Noah','Reyes','M',6,0,'101_Reyes_2001','Section A',119,36,'[19.1, 19.1, 19.1, 25.4]','[\"overweight\", \"normal\", \"normal\", \"overweight\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1005,'Ella','Flores','F',6,0,'101_Reyes_2001','Section A',117,30,'[13.1, 13.1, 13.1, 21.9]','[\"underweight\", \"underweight\", \"underweight\", \"normal\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1006,'Ethan','Dela Cruz','M',7,0,'101_Reyes_2001','Section A',124,33,'[14.3, 14.3, 14.3, 21.5]','[\"normal\", \"underweight\", \"underweight\", \"normal\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1007,'Sofia','Mendoza','F',7,0,'101_Reyes_2001','Section A',122,38,'[14.1, 14.1, 14.1, 25.5]','[\"normal\", \"underweight\", \"underweight\", \"overweight\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1008,'Lucas','Ramos','M',7,0,'101_Reyes_2001','Section A',125,28,'[19.2, 19.2, 19.2, 17.9]','[\"overweight\", \"normal\", \"normal\", \"underweight\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1009,'Chloe','Torres','F',7,0,'101_Reyes_2001','Section A',121,25,'[12.3, 12.3, 12.3, 17.1]','[\"underweight\", \"underweight\", \"underweight\", \"underweight\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1010,'Jacob','Navarro','M',7,0,'101_Reyes_2001','Section A',123,29,'[17.2, 17.2, 17.2, 19.2]','[\"overweight\", \"underweight\", \"underweight\", \"normal\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1011,'Isla','Villanueva','F',8,0,'101_Reyes_2001','Section A',128,28,'[14.6, 14.6, 14.6, 17.1]','[\"normal\", \"underweight\", \"underweight\", \"underweight\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1012,'Benjamin','Solomon','M',8,0,'101_Reyes_2001','Section A',130,22,'[14.2, 14.2, 14.2, 13.0]','[\"normal\", \"underweight\", \"underweight\", \"underweight\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1013,'Grace','Morales','F',8,0,'101_Reyes_2001','Section A',127,35,'[12.4, 12.4, 12.4, 21.7]','[\"underweight\", \"underweight\", \"underweight\", \"normal\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1014,'Henry','Aquino','M',8,0,'101_Reyes_2001','Section A',129,33,'[19.8, 19.8, 19.8, 19.8]','[\"overweight\", \"normal\", \"normal\", \"normal\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1015,'Zoe','Bautista','F',8,0,'101_Reyes_2001','Section A',126,40,'[17.6, 17.6, 17.6, 20.2, 25.2]','[\"overweight\", \"underweight\", \"underweight\", \"normal\", \"overweight\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\", \"2026-03-07\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-07 06:33:47'),(1016,'Oliver','Domingo','M',7,0,'101_Reyes_2001','Section A',120,16,'[11.1, 11.1, 11.1, 11.1]','[\"underweight\", \"underweight\", \"underweight\", \"underweight\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1018,'Mateo','Padilla','M',6,0,'101_Reyes_2001','Section A',115,24,'[18.1, 18.1, 18.1, 18.1]','[\"overweight\", \"underweight\", \"underweight\", \"underweight\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1019,'Harper','Lim','F',6,0,'101_Reyes_2001','Section A',119,21,'[14.8, 14.8, 14.8, 14.8]','[\"normal\", \"underweight\", \"underweight\", \"underweight\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1020,'Samuel','Chua','M',8,0,'101_Reyes_2001','Section A',131,18,'[11.1, 11.1, 11.1, 10.5]','[\"underweight\", \"underweight\", \"underweight\", \"underweight\"]','[\"2026-02-02\", \"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:06:07','2026-03-02 04:59:10'),(1021,'Wilbur','Lewis Pacolor','M',7,0,'101_Reyes_2001','Section A',175,65,'[21.2, 21.2, 21.2]','[\"normal\", \"normal\", \"normal\"]','[\"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:35:09','2026-03-02 04:59:10'),(1023,'Nikka Noreine','Reyes','F',8,0,'101_Reyes_2001','Section A',150,60,'[26.7, 26.7, 26.7]','[\"overweight\", \"overweight\", \"overweight\"]','[\"2026-02-08\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-08 11:59:17','2026-03-02 04:59:10'),(1024,'Oreo','Boreo','M',9,0,'101_Reyes_2001','Section A',173,61,'[20.4, 20.4, 20.4]','[\"normal\", \"normal\", \"normal\"]','[\"2026-02-15\", \"2026-02-17\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-14 16:24:08','2026-03-02 04:59:10'),(1025,'Cloud','Pacolor','M',9,8,'101_Reyes_2004','Sampaguita',173,56,'[21, 18.7]','[\"normal\", \"normal\"]','[\"2026-02-15\", \"2026-03-01\"]',NULL,101,NULL,'2026-02-15 09:32:18','2026-03-01 14:21:10'),(1029,'Geralt','Of Rivia','M',14,0,'101_Reyes_2001','Section A',180,75,'[23.1, 23.1]','[\"normal\", \"normal\"]','[\"2026-02-25\", \"2026-03-02\"]',NULL,101,NULL,'2026-02-25 01:29:37','2026-03-02 04:59:10');
/*!40000 ALTER TABLE `tblstudents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblteachers`
--

DROP TABLE IF EXISTS `tblteachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tblteachers` (
  `teacher_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `mobile_no` varchar(255) DEFAULT NULL,
  `school_name` varchar(255) DEFAULT NULL,
  `is_first_login` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblteachers`
--

LOCK TABLES `tblteachers` WRITE;
/*!40000 ALTER TABLE `tblteachers` DISABLE KEYS */;
INSERT INTO `tblteachers` VALUES (101,'Nikka Noreine','Reyes','reimarkable@gmail.com','1234','09498112655','Nueva Ecija High School',0,'2026-02-19 14:09:28','2026-02-19 15:17:40'),(102,'Jeleazar','Pacolor','jepacolor.f@gmail.com','1234','09498112655','Nueva Ecija High School',0,'2026-02-19 14:09:28','2026-02-19 14:09:28'),(103,'Oreo','Pacolor','oreo@gmail.com','1234','09498112655','Nueva Ecija High School',0,'2026-02-19 14:09:28','2026-02-19 14:09:28'),(104,'Juan','Dela Cruz','JuanDelaCruz@gmail.com','123','09955649425','Unknown Integrated School',1,'2026-03-07 08:27:27','2026-03-07 13:13:02');
/*!40000 ALTER TABLE `tblteachers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-07 21:18:47
