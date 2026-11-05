-- VetCare - Script do banco de dados (Amazon RDS MySQL)
-- Cria o banco, as tabelas e a carga inicial dos veterinários.
-- Pode ser executado mais de uma vez sem duplicar dados.
-- Executar a partir da EC2 da aplicação:
--   mysql -h <ENDPOINT_DO_RDS> -u admin -p < sql/schema.sql

-- Garante que os acentos (ex.: 'Cão') sejam gravados corretamente
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS vetcare
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE vetcare;

-- Veterinários: cadastrados pela carga inicial (final deste script) e apenas listados no sistema
CREATE TABLE IF NOT EXISTS veterinarios (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    nome          VARCHAR(100) NOT NULL,
    crmv          VARCHAR(20)  NOT NULL UNIQUE,
    especialidade VARCHAR(50)  NOT NULL,
    criado_em     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tutores (lado 1 da relação 1:N com pets)
CREATE TABLE IF NOT EXISTS tutores (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    nome          VARCHAR(100) NOT NULL,
    cpf           CHAR(11)     NOT NULL UNIQUE,      -- gravado só com dígitos
    telefone      VARCHAR(11)  NOT NULL,             -- 10 ou 11 dígitos
    email         VARCHAR(100),
    criado_em     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_tutores_nome     CHECK (CHAR_LENGTH(nome) >= 3),
    CONSTRAINT chk_tutores_cpf      CHECK (cpf REGEXP '^[0-9]{11}$'),
    CONSTRAINT chk_tutores_telefone CHECK (telefone REGEXP '^[0-9]{10,11}$')
);

-- Pets (lado N): cada pet pertence a 1 tutor e tem 1 veterinário responsável
CREATE TABLE IF NOT EXISTS pets (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id             INT          NOT NULL,
    veterinario_id       INT          NOT NULL,
    nome                 VARCHAR(50)  NOT NULL,
    especie              VARCHAR(10)  NOT NULL,
    raca                 VARCHAR(50),
    data_nascimento      DATE,
    peso                 DECIMAL(5,2),
    ativo                BOOLEAN      NOT NULL DEFAULT TRUE,
    -- Fotos (RF-02/RF-03): o banco guarda apenas as chaves dos arquivos no S3
    foto_chave           VARCHAR(255),
    foto_thumbnail_chave VARCHAR(255),
    foto_status          VARCHAR(12),
    criado_em            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- RESTRICT: um tutor com pets não pode ser excluído (spec US-01)
    CONSTRAINT fk_pets_tutor       FOREIGN KEY (tutor_id)       REFERENCES tutores(id)      ON DELETE RESTRICT,
    CONSTRAINT fk_pets_veterinario FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id) ON DELETE RESTRICT,
    CONSTRAINT chk_pets_especie     CHECK (especie IN ('Cão', 'Gato', 'Ave', 'Roedor', 'Réptil', 'Outro')),
    CONSTRAINT chk_pets_peso        CHECK (peso IS NULL OR peso > 0),
    CONSTRAINT chk_pets_foto_status CHECK (foto_status IS NULL OR foto_status IN ('processando', 'pronta', 'erro'))
);

-- Consultas (RF-06): relação N:N entre pets e veterinários.
-- Duração fixa de 30 minutos; o conflito de horário é controlado pela API (ADR-004).
CREATE TABLE IF NOT EXISTS consultas (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    pet_id         INT          NOT NULL,
    veterinario_id INT          NOT NULL,
    data_hora      DATETIME     NOT NULL,            -- horário de Brasília
    motivo         VARCHAR(200) NOT NULL,
    observacoes    TEXT,
    status         VARCHAR(10)  NOT NULL DEFAULT 'agendada',
    criado_em      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- RESTRICT: um pet com consultas não pode ser excluído (spec US-02); deve ser inativado
    CONSTRAINT fk_consultas_pet         FOREIGN KEY (pet_id)         REFERENCES pets(id)         ON DELETE RESTRICT,
    CONSTRAINT fk_consultas_veterinario FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id) ON DELETE RESTRICT,
    CONSTRAINT chk_consultas_status CHECK (status IN ('agendada', 'realizada', 'cancelada')),
    INDEX idx_consultas_vet_data (veterinario_id, data_hora),
    INDEX idx_consultas_pet_data (pet_id, data_hora)
);

-- ---------------------------------------------------------------------------
-- Carga inicial dos veterinários
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO veterinarios (nome, crmv, especialidade) VALUES
    ('Dra. Camila Rocha', 'CRMV-SP 12345', 'Clínica geral'),
    ('Dr. Rafael Souza',  'CRMV-SP 23456', 'Ortopedia'),
    ('Dra. Juliana Lima', 'CRMV-SP 34567', 'Dermatologia');
