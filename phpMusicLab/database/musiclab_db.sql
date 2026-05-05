-- SCRIPT DE RESTAURACIÓN DEFINITIVO (Emails Normalizados)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- 1. DESACTIVAR VERIFICACIONES
SET FOREIGN_KEY_CHECKS = 0;

-- 2. BORRAR TABLAS (Orden inverso)
DROP TABLE IF EXISTS `followers`;
DROP TABLE IF EXISTS `posts`;
DROP TABLE IF EXISTS `site_config`;
DROP TABLE IF EXISTS `users`;

-- 3. CREAR TABLAS

-- Tabla USERS
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` int(11) DEFAULT 0,
  `artist_type` varchar(100) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `profile_img_url` varchar(255) DEFAULT 'default_profile.png',
  `status` tinyint(4) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla SITE_CONFIG
CREATE TABLE `site_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `site_name` varchar(100) NOT NULL,
  `maintenance_mode` tinyint(1) DEFAULT 0,
  `welcome_text` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla FOLLOWERS
CREATE TABLE `followers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `follower_id` int(11) NOT NULL,
  `followed_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_follow` (`follower_id`,`followed_id`),
  KEY `fk_followed` (`followed_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla POSTS
CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `file_url` varchar(255) NOT NULL,
  `file_type` enum('audio','lyrics','score') NOT NULL,
  `visibility` enum('public','followers','private') NOT NULL DEFAULT 'public',
  `destination_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `posts_user_fk` (`user_id`),
  KEY `fk_post_destination_user` (`destination_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- 4. INSERTAR DATOS (Emails Corregidos)

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password`, `role`, `artist_type`, `bio`, `profile_img_url`, `status`, `created_at`) VALUES
(1, 'Bautista', 'Rodriguez', 'bautista.owner@gmail.com', '$2y$10$suO72wgsmAXFCuUF/jk47eXepUINbCZmam/zFmSyFYAXyGo5yaYqa', 2, 'Another', 'Dueño y creador de MusicLab.', 'owner.png', 1, '2026-02-06 22:38:11'),
(2, 'Alex', 'Thunder', 'alex@gmail.com', '$2y$10$suO72wgsmAXFCuUF/jk47eXepUINbCZmam/zFmSyFYAXyGo5yaYqa', 0, 'Guitarist', 'Riffs that shake the ground.', 'default_profile.png', 1, '2026-02-06 22:38:11'),
(3, 'Roxy', 'Blaze', 'roxy@gmail.com', '$2y$10$suO72wgsmAXFCuUF/jk47eXepUINbCZmam/zFmSyFYAXyGo5yaYqa', 0, 'Vocalist', 'Voice of the rebellion.', 'default_profile.png', 1, '2026-02-06 22:38:11'),
(4, 'Kurt', 'Vibe', 'kurt@gmail.com', '$2y$10$suO72wgsmAXFCuUF/jk47eXepUINbCZmam/zFmSyFYAXyGo5yaYqa', 0, 'Guitarist', 'Grunge is not dead.', 'default_profile.png', 1, '2026-02-06 22:38:11'),
(5, 'Leo', 'King', 'leo@gmail.com', '$2y$10$suO72wgsmAXFCuUF/jk47eXepUINbCZmam/zFmSyFYAXyGo5yaYqa', 0, 'Pianist', 'Operatic rock enthusiast.', 'default_profile.png', 1, '2026-02-06 22:38:11'),
(6, 'Syd', 'Moon', 'syd@gmail.com', '$2y$10$suO72wgsmAXFCuUF/jk47eXepUINbCZmam/zFmSyFYAXyGo5yaYqa', 0, 'Guitarist', 'Psychedelic sounds and echoes.', 'default_profile.png', 1, '2026-02-07 15:36:11'),
(7, 'Mick', 'Stone', 'mick@gmail.com', '$2y$10$suO72wgsmAXFCuUF/jk47eXepUINbCZmam/zFmSyFYAXyGo5yaYqa', 0, 'Vocalist', 'Rolling through the ages.', 'default_profile.png', 1, '2026-02-07 15:36:11'),
(8, 'James', 'Steel', 'james@gmail.com', '$2y$10$suO72wgsmAXFCuUF/jk47eXepUINbCZmam/zFmSyFYAXyGo5yaYqa', 0, 'Bassist', 'Heavy metal thunder.', 'default_profile.png', 1, '2026-02-07 15:36:11'),
(9, 'Ozzy', 'Dark', 'ozzy@gmail.com', '$2y$10$suO72wgsmAXFCuUF/jk47eXepUINbCZmam/zFmSyFYAXyGo5yaYqa', 0, 'Vocalist', 'Prince of darkness.', 'default_profile.png', 1, '2026-02-07 15:36:11'),
(10, 'Eddie', 'Speed', 'eddie@gmail.com', '$2y$10$suO72wgsmAXFCuUF/jk47eXepUINbCZmam/zFmSyFYAXyGo5yaYqa', 0, 'Guitarist', 'Faster than light tapping.', 'default_profile.png', 1, '2026-02-07 15:36:11'),
(11, 'Joan', 'Rebel', 'joan@gmail.com', '$2y$10$suO72wgsmAXFCuUF/jk47eXepUINbCZmam/zFmSyFYAXyGo5yaYqa', 0, 'Vocalist', 'Punk rock queen.', 'default_profile.png', 1, '2026-02-07 15:36:11'),
(12, 'Bruce', 'Boss', 'bruce@gmail.com', '$2y$10$suO72wgsmAXFCuUF/jk47eXepUINbCZmam/zFmSyFYAXyGo5yaYqa', 0, 'Saxophonist', 'Stories from the heartland.', 'default_profile.png', 1, '2026-02-07 15:36:11'),
(13, 'Paul', 'Echo', 'paul@gmail.com', '$2y$10$suO72wgsmAXFCuUF/jk47eXepUINbCZmam/zFmSyFYAXyGo5yaYqa', 0, 'Drummer', 'Anthems for the world.', 'default_profile.png', 1, '2026-02-07 15:36:11'),
(14, 'Steven', 'Lips', 'steven@gmail.com', '$2y$10$suO72wgsmAXFCuUF/jk47eXepUINbCZmam/zFmSyFYAXyGo5yaYqa', 0, 'Trumpeter', 'Sweet emotions and rock.', 'default_profile.png', 1, '2026-02-07 15:36:11'),
(15, 'Jimmy', 'Zep', 'jimmy@gmail.com', '$2y$10$suO72wgsmAXFCuUF/jk47eXepUINbCZmam/zFmSyFYAXyGo5yaYqa', 0, 'DJ', 'Stairway to rock heaven.', 'default_profile.png', 1, '2026-02-07 15:36:11');

-- SITE_CONFIG
INSERT INTO `site_config` (`id`, `site_name`, `maintenance_mode`, `welcome_text`) VALUES
(1, 'MusicLab', 0, 'Collaborate with musicians from all over the world');

-- FOLLOWERS
INSERT INTO `followers` (`id`, `follower_id`, `followed_id`) VALUES
(1, 1, 2), (2, 1, 3), (3, 4, 1), (5, 5, 4), (6, 6, 1), (7, 7, 6), (8, 8, 7), (9, 9, 8), (10, 10, 9);

-- POSTS
INSERT INTO `posts` (`id`, `user_id`, `title`, `description`, `file_url`, `file_type`, `visibility`, `destination_id`, `created_at`) VALUES
(1, 1, 'Neon Lights', 'Synthwave experiment with guitar overlay.', 'track_neon_01.mp3', 'audio', 'public', NULL, '2026-02-09 02:59:33'),
(2, 2, 'Desert Rain', 'A dry, acoustic intro that builds up.', 'track_desert_rain.mp3', 'audio', 'public', NULL, '2026-02-09 01:59:33'),
(3, 3, 'Urban Jungle', 'Hard rock anthem for the city life.', 'track_urban_jungle.mp3', 'audio', 'public', NULL, '2026-02-09 00:59:33'),
(4, 4, 'Smells Like Coffee', 'Grunge jam session recorded in garage.', 'track_coffee_grunge.mp3', 'audio', 'public', NULL, '2026-02-08 23:59:33'),
(5, 5, 'Galactic Rhapsody', 'Operatic vocals mixed with space rock.', 'track_galactic_rhapsody.mp3', 'audio', 'public', NULL, '2026-02-08 22:59:33'),
(6, 6, 'Comfortably Dumb', 'Parody track with serious guitar skills.', 'track_comfortably_dumb.mp3', 'audio', 'public', NULL, '2026-02-08 21:59:33'),
(7, 7, 'Paint It Blue', 'Blues rock improvisation in A minor.', 'track_paint_blue.mp3', 'audio', 'public', NULL, '2026-02-08 20:59:33'),
(8, 8, 'Enter Snowman', 'Heavy metal winter holiday special.', 'track_enter_snowman.mp3', 'audio', 'public', NULL, '2026-02-08 02:59:33'),
(9, 9, 'Lazy Train', 'Slow doom metal track.', 'track_lazy_train.mp3', 'audio', 'public', NULL, '2026-02-07 02:59:33'),
(10, 10, 'Explosion Tapping', 'Two-minute shredding solo.', 'track_explosion_tap.mp3', 'audio', 'public', NULL, '2026-02-06 02:59:33'),
(11, 11, 'Good Reputation', 'Pop-punk upbeat song about being nice.', 'track_good_rep.mp3', 'audio', 'public', NULL, '2026-02-05 02:59:33'),
(12, 12, 'Dancing in the Light', 'Folk rock song about morning.', 'track_dancing_light.mp3', 'audio', 'public', NULL, '2026-02-04 02:59:33'),
(13, 13, 'Monday Bloody Monday', 'Song about how much I hate Mondays.', 'track_monday_bloody.mp3', 'audio', 'public', NULL, '2026-02-03 02:59:33'),
(14, 14, 'Run This Way', 'Fitness rock track for jogging.', 'track_run_way.mp3', 'audio', 'public', NULL, '2026-02-02 02:59:33'),
(15, 15, 'Whole Lotta Like', 'Social media satire in blues rock style.', 'track_whole_like.mp3', 'audio', 'public', NULL, '2026-02-02 02:59:33');


-- 5. RESTRICCIONES (Al final)

ALTER TABLE `followers`
  ADD CONSTRAINT `fk_followed` FOREIGN KEY (`followed_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_follower` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `posts`
  ADD CONSTRAINT `fk_post_destination_user` FOREIGN KEY (`destination_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `posts_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- 6. FINALIZAR
SET FOREIGN_KEY_CHECKS = 1;
COMMIT;