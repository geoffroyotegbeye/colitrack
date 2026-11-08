-- ============================================
-- ColiTrack — Script d'initialisation PostgreSQL
-- Appliqué sur la base locale Docker (voir docker-compose.yml) : npm run db:init
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE : users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id            TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  full_name     VARCHAR(150) NOT NULL DEFAULT '',
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(30)  DEFAULT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'client' CHECK (role IN ('admin','agent','client')),
  status        VARCHAR(20)  NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Migration additive (schéma déjà existant avant l'ajout de status)
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active','suspended'));

-- ============================================
-- TABLE : commandes
-- ============================================
CREATE TABLE IF NOT EXISTS commandes (
  id                TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tracking_number   VARCHAR(50)   NOT NULL UNIQUE,
  client_id         TEXT          REFERENCES users(id) ON DELETE SET NULL,
  client_name       VARCHAR(150)  NOT NULL,
  client_phone      VARCHAR(30)   NOT NULL,
  client_email      VARCHAR(150)  DEFAULT NULL,
  address_from      VARCHAR(255)  NOT NULL,
  address_to        VARCHAR(255)  NOT NULL,
  package_type      VARCHAR(20)   NOT NULL DEFAULT 'medium' CHECK (package_type IN ('document','small','medium','large','fragile','special')),
  weight            NUMERIC(10,2) NOT NULL DEFAULT 0,
  volume            NUMERIC(10,4) NOT NULL DEFAULT 0,
  price             NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax               NUMERIC(12,2) NOT NULL DEFAULT 0,
  status            VARCHAR(30)   NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','validated','purchased','in_china','shipped','in_transit','arrived_benin','delivering','delivered','refused')),
  agent_id          TEXT          REFERENCES users(id) ON DELETE SET NULL,
  product           VARCHAR(255)  DEFAULT '',
  quantity          INT           NOT NULL DEFAULT 1,
  product_link      VARCHAR(500)  DEFAULT NULL,
  delivery_mode     VARCHAR(50)   NOT NULL DEFAULT 'standard',
  city              VARCHAR(100)  DEFAULT '',
  notes             TEXT          DEFAULT NULL,
  estimated_arrival DATE          DEFAULT NULL,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE : tracking_history
-- ============================================
CREATE TABLE IF NOT EXISTS tracking_history (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  commande_id  TEXT        NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
  status       VARCHAR(30) NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  changed_by   TEXT        REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE : notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id              TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commande_id     TEXT         REFERENCES commandes(id) ON DELETE CASCADE,
  tracking_number VARCHAR(50)  DEFAULT NULL,
  title           VARCHAR(255) NOT NULL,
  message         TEXT         NOT NULL DEFAULT '',
  status          VARCHAR(50)  NOT NULL DEFAULT '',
  is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE : notification_subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id              TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tracking_number VARCHAR(50)  NOT NULL,
  email           VARCHAR(150) NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(tracking_number, email)
);

-- ============================================
-- TABLE : commande_images (photos liées à une commande)
-- ============================================
CREATE TABLE IF NOT EXISTS commande_images (
  id           TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  commande_id  TEXT         NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
  image_url    VARCHAR(500) NOT NULL,
  caption      VARCHAR(255) DEFAULT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE : saved_products (catalogue produits réutilisables par agent)
-- ============================================
CREATE TABLE IF NOT EXISTS saved_products (
  id                TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id           TEXT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(255)  NOT NULL,
  normalized_name   VARCHAR(255)  NOT NULL,
  description       TEXT          DEFAULT NULL,
  category          VARCHAR(100)  DEFAULT NULL,
  default_quantity  INT           NOT NULL DEFAULT 1,
  default_price     NUMERIC(12,2) NOT NULL DEFAULT 0,
  product_link      VARCHAR(500)  DEFAULT NULL,
  usage_count       INT           NOT NULL DEFAULT 0,
  is_global         BOOLEAN       NOT NULL DEFAULT false,
  stock_quantity    INT           NOT NULL DEFAULT 0,
  weight            NUMERIC(10,2) NOT NULL DEFAULT 0,
  dimensions        VARCHAR(100)  DEFAULT NULL,
  tax               NUMERIC(12,2) NOT NULL DEFAULT 0,
  status            VARCHAR(20)   NOT NULL DEFAULT 'active' CHECK (status IN ('active','hidden')),
  main_image_url    VARCHAR(500)  DEFAULT NULL,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE : saved_product_images
-- ============================================
CREATE TABLE IF NOT EXISTS saved_product_images (
  id               TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  saved_product_id TEXT         NOT NULL REFERENCES saved_products(id) ON DELETE CASCADE,
  image_url        VARCHAR(500) NOT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE : digimarket_profiles (candidature agent — validation admin avant de devenir agent)
-- ============================================
CREATE TABLE IF NOT EXISTS digimarket_profiles (
  id               TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id          TEXT          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  shop_name        VARCHAR(150)  DEFAULT NULL,
  bio              TEXT          DEFAULT NULL,
  whatsapp         VARCHAR(30)   DEFAULT NULL,
  country          VARCHAR(100)  DEFAULT NULL,
  city             VARCHAR(100)  DEFAULT NULL,
  address          VARCHAR(255)  DEFAULT NULL,
  logo_url         VARCHAR(500)  DEFAULT NULL,
  banner_url       VARCHAR(500)  DEFAULT NULL,
  id_card_url      VARCHAR(500)  DEFAULT NULL,
  id_card_number   VARCHAR(50)   DEFAULT NULL,
  selfie_url       VARCHAR(500)  DEFAULT NULL,
  occupation       VARCHAR(150)  DEFAULT NULL,
  motivation       TEXT          DEFAULT NULL,
  emergency_contact_name  VARCHAR(150) DEFAULT NULL,
  emergency_contact_phone VARCHAR(30)  DEFAULT NULL,
  status           VARCHAR(20)   NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rejected','suspended')),
  commission_rate  NUMERIC(5,2)  NOT NULL DEFAULT 10,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE : colis (généré à partir d'une commande confirmée)
-- ============================================
CREATE TABLE IF NOT EXISTS colis (
  id                TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  commande_id       TEXT          NOT NULL UNIQUE REFERENCES commandes(id) ON DELETE CASCADE,
  tracking_number   VARCHAR(50)   NOT NULL,
  status            VARCHAR(30)   NOT NULL DEFAULT 'recu' CHECK (status IN
                       ('recu','en_attente','emballe','en_transit','arrive_agence','en_livraison','livre','retourne','perdu')),
  photo_url         VARCHAR(500)  DEFAULT NULL,
  weight            NUMERIC(10,2) DEFAULT 0,
  dimensions        VARCHAR(100)  DEFAULT NULL,
  destination       VARCHAR(255)  DEFAULT NULL,
  carrier           VARCHAR(150)  DEFAULT NULL,
  agent_id          TEXT          REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE : categories (catégories produits gérées par l'admin — Module 11)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        VARCHAR(100) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE : tax_settings (taux de taxe global, appliqué automatiquement — Module 5)
-- ============================================
CREATE TABLE IF NOT EXISTS tax_settings (
  id          TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  rate        NUMERIC(5,2)  NOT NULL DEFAULT 0,
  updated_by  TEXT          REFERENCES users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE : transport_rates (tarif + délai global par mode de transport, calcul automatique)
-- ============================================
CREATE TABLE IF NOT EXISTS transport_rates (
  id             TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  mode           VARCHAR(20)   NOT NULL UNIQUE CHECK (mode IN ('standard','express','maritime','aerien')),
  rate_per_kg    NUMERIC(10,2) NOT NULL DEFAULT 0,
  delay_min_days INT           NOT NULL DEFAULT 0,
  delay_max_days INT           NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE : product_transport_modes (modes de transport activés pour un produit du catalogue)
-- ============================================
CREATE TABLE IF NOT EXISTS product_transport_modes (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL REFERENCES saved_products(id) ON DELETE CASCADE,
  mode       VARCHAR(20) NOT NULL CHECK (mode IN ('standard','express','maritime','aerien')),
  UNIQUE(product_id, mode)
);

-- ============================================
-- TABLE : colis_history (déplacements/statuts d'un colis)
-- ============================================
CREATE TABLE IF NOT EXISTS colis_history (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  colis_id     TEXT        NOT NULL REFERENCES colis(id) ON DELETE CASCADE,
  status       VARCHAR(30) NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  changed_by   TEXT        REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEX
-- ============================================
CREATE INDEX IF NOT EXISTS idx_commandes_tracking  ON commandes(tracking_number);
CREATE INDEX IF NOT EXISTS idx_commandes_client    ON commandes(client_id);
CREATE INDEX IF NOT EXISTS idx_commandes_agent     ON commandes(agent_id);
CREATE INDEX IF NOT EXISTS idx_commandes_status    ON commandes(status);
CREATE INDEX IF NOT EXISTS idx_tracking_commande   ON tracking_history(commande_id);

-- Migration additive (schéma déjà existant avant l'ajout de changed_by)
ALTER TABLE tracking_history ADD COLUMN IF NOT EXISTS changed_by TEXT REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tracking_changed_by ON tracking_history(changed_by);

-- Migration additive (schéma déjà existant avant l'ajout du catalogue produits — Module 4)
ALTER TABLE saved_products ADD COLUMN IF NOT EXISTS is_global BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE saved_products ADD COLUMN IF NOT EXISTS stock_quantity INT NOT NULL DEFAULT 0;
ALTER TABLE saved_products ADD COLUMN IF NOT EXISTS weight NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE saved_products ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100) DEFAULT NULL;
ALTER TABLE saved_products ADD COLUMN IF NOT EXISTS tax NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE saved_products ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE saved_products ADD COLUMN IF NOT EXISTS main_image_url VARCHAR(500) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_products_global ON saved_products(is_global);
ALTER TABLE digimarket_profiles ADD COLUMN IF NOT EXISTS address VARCHAR(255) DEFAULT NULL;
ALTER TABLE digimarket_profiles ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE digimarket_profiles ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE notifications ALTER COLUMN tracking_number DROP NOT NULL;
ALTER TABLE digimarket_profiles ADD COLUMN IF NOT EXISTS id_card_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE digimarket_profiles ADD COLUMN IF NOT EXISTS id_card_number VARCHAR(50) DEFAULT NULL;
ALTER TABLE digimarket_profiles ADD COLUMN IF NOT EXISTS selfie_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE digimarket_profiles ADD COLUMN IF NOT EXISTS occupation VARCHAR(150) DEFAULT NULL;
ALTER TABLE digimarket_profiles ADD COLUMN IF NOT EXISTS motivation TEXT DEFAULT NULL;
ALTER TABLE digimarket_profiles ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(150) DEFAULT NULL;
ALTER TABLE digimarket_profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(30) DEFAULT NULL;
ALTER TABLE digimarket_profiles ALTER COLUMN shop_name DROP NOT NULL;
ALTER TABLE digimarket_profiles DROP CONSTRAINT IF EXISTS digimarket_profiles_status_check;
ALTER TABLE digimarket_profiles ADD CONSTRAINT digimarket_profiles_status_check CHECK (status IN ('pending','active','rejected','suspended'));
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS transport_cost NUMERIC(12,2) NOT NULL DEFAULT 0;
INSERT INTO transport_rates (mode, rate_per_kg, delay_min_days, delay_max_days) VALUES
  ('standard', 0, 14, 20),
  ('express', 0, 3, 7),
  ('maritime', 0, 35, 50),
  ('aerien', 0, 5, 14)
ON CONFLICT (mode) DO NOTHING;
INSERT INTO tax_settings (id, rate) SELECT gen_random_uuid()::text, 0 WHERE NOT EXISTS (SELECT 1 FROM tax_settings);
INSERT INTO categories (id, name) VALUES
  (gen_random_uuid()::text, 'Mode & Vêtements'),
  (gen_random_uuid()::text, 'Tech & Gadgets'),
  (gen_random_uuid()::text, 'Accessoires'),
  (gen_random_uuid()::text, 'Beauté & Soins'),
  (gen_random_uuid()::text, 'Chaussures'),
  (gen_random_uuid()::text, 'Maison & Déco')
ON CONFLICT (name) DO NOTHING;
CREATE INDEX IF NOT EXISTS idx_notifications_user  ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_commande_images_commande     ON commande_images(commande_id);
CREATE INDEX IF NOT EXISTS idx_saved_products_user           ON saved_products(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_products_name           ON saved_products(name);
CREATE INDEX IF NOT EXISTS idx_saved_products_normalized     ON saved_products(normalized_name);
CREATE INDEX IF NOT EXISTS idx_saved_product_images_product  ON saved_product_images(saved_product_id);
CREATE INDEX IF NOT EXISTS idx_product_transport_modes_product ON product_transport_modes(product_id);
CREATE INDEX IF NOT EXISTS idx_digimarket_profiles_user_id   ON digimarket_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_digimarket_profiles_status    ON digimarket_profiles(status);
CREATE INDEX IF NOT EXISTS idx_colis_commande        ON colis(commande_id);
CREATE INDEX IF NOT EXISTS idx_colis_tracking        ON colis(tracking_number);
CREATE INDEX IF NOT EXISTS idx_colis_agent           ON colis(agent_id);
CREATE INDEX IF NOT EXISTS idx_colis_status          ON colis(status);
CREATE INDEX IF NOT EXISTS idx_colis_history_colis   ON colis_history(colis_id);
CREATE INDEX IF NOT EXISTS idx_users_status          ON users(status);

-- ============================================
-- TABLE : courses (Centre de formation — Module 10)
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
  id            TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title         VARCHAR(200)  NOT NULL,
  description   TEXT          DEFAULT NULL,
  thumbnail_url VARCHAR(500)  DEFAULT NULL,
  is_free       BOOLEAN       NOT NULL DEFAULT true,
  price         NUMERIC(12,2) NOT NULL DEFAULT 0,
  status        VARCHAR(20)   NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_by    TEXT          REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE : course_lessons (vidéo, PDF ou quiz, ordonnées par position)
-- ============================================
CREATE TABLE IF NOT EXISTS course_lessons (
  id           TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  course_id    TEXT         NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  type         VARCHAR(20)  NOT NULL CHECK (type IN ('video','pdf','quiz')),
  content_url  VARCHAR(500) DEFAULT NULL,
  quiz_data    JSONB        DEFAULT NULL,
  position     INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE : course_progress (une leçon complétée par un utilisateur)
-- ============================================
CREATE TABLE IF NOT EXISTS course_progress (
  id           TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id      TEXT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id    TEXT          NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id    TEXT          NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  quiz_score   NUMERIC(5,2)  DEFAULT NULL,
  completed_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

-- ============================================
-- TABLE : certificates (délivré quand toutes les leçons d'un cours sont complétées)
-- ============================================
CREATE TABLE IF NOT EXISTS certificates (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id  TEXT        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  issued_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_course   ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_user     ON course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course   ON course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user        ON certificates(user_id);

-- ============================================
-- Trigger updated_at automatique
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_commandes_updated_at ON commandes;
CREATE TRIGGER trg_commandes_updated_at
  BEFORE UPDATE ON commandes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_colis_updated_at ON colis;
CREATE TRIGGER trg_colis_updated_at
  BEFORE UPDATE ON colis FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_courses_updated_at ON courses;
CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Admin par défaut — mot de passe : Admin1234!
-- ============================================
INSERT INTO users (full_name, email, password_hash, role)
VALUES (
  'Administrateur',
  'admin@colitrack.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Affiliation & commissions (ajouté après coup — alignement du schéma sur la prod)
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_links (
  id          TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code        VARCHAR(30)  NOT NULL UNIQUE,
  product_id  TEXT         NOT NULL REFERENCES saved_products(id) ON DELETE CASCADE,
  agent_id    TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clicks      INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, agent_id)
);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_agent ON affiliate_links(agent_id);

ALTER TABLE saved_products ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2);
ALTER TABLE tax_settings   ADD COLUMN IF NOT EXISTS default_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10;
ALTER TABLE commandes      ADD COLUMN IF NOT EXISTS affiliate_link_id TEXT REFERENCES affiliate_links(id) ON DELETE SET NULL;
ALTER TABLE commandes      ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12,2);
ALTER TABLE commandes      ADD COLUMN IF NOT EXISTS commission_paid_at TIMESTAMPTZ;
