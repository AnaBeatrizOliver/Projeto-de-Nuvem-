-- VetCare - Script do banco de dados (Amazon RDS MySQL)
-- Cria o banco, as tabelas e a carga inicial dos veterinários.
-- Pode ser executado mais de uma vez sem duplicar dados.
-- Executar a partir da EC2 da aplicação:
--   mysql -h <ENDPOINT_DO_RDS> -u admin -p < sql/criar_banco_vetcare.sql

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
    id              INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id        INT          NOT NULL,
    veterinario_id  INT          NOT NULL,
    nome            VARCHAR(50)  NOT NULL,
    especie         VARCHAR(10)  NOT NULL,
    raca            VARCHAR(50),
    data_nascimento DATE,
    peso            DECIMAL(5,2),
    ativo           BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- RESTRICT: um tutor com pets não pode ser excluído (spec US-01)
    CONSTRAINT fk_pets_tutor       FOREIGN KEY (tutor_id)       REFERENCES tutores(id)      ON DELETE RESTRICT,
    CONSTRAINT fk_pets_veterinario FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id) ON DELETE RESTRICT,
    CONSTRAINT chk_pets_especie CHECK (especie IN ('Cão', 'Gato', 'Ave', 'Roedor', 'Réptil', 'Outro')),
    CONSTRAINT chk_pets_peso    CHECK (peso IS NULL OR peso > 0)
);

-- ---------------------------------------------------------------------------
-- Carga inicial dos veterinários
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO veterinarios (nome, crmv, especialidade) VALUES
    ('Dra. Camila Rocha', 'CRMV-SP 12345', 'Clínica geral'),
    ('Dr. Rafael Souza',  'CRMV-SP 23456', 'Ortopedia'),
    ('Dra. Juliana Lima', 'CRMV-SP 34567', 'Dermatologia');
