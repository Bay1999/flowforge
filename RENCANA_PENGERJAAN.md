# 🔥 FlowForge — Rencana Pengerjaan Interview Project
> **Durasi:** 4 Hari | **Codename:** FlowForge
> Platform: Real-Time Multi-Tenant Workflow Orchestration Engine

---

## 🗺️ Gambaran Besar

FlowForge adalah platform di mana tim bisa mendefinisikan, menjalankan, memantau, dan berkolaborasi pada automated workflow secara real-time — perpaduan antara Zapier dan GitHub Actions.

### Stack Teknologi yang Direkomendasikan
| Layer | Teknologi |
|-------|-----------|
| **Backend** | Node.js (Express/Fastify) atau Go |
| **Database** | PostgreSQL (relasional) + Redis (queue/cache) |
| **Message Broker** | BullMQ (berbasis Redis) atau RabbitMQ |
| **Frontend** | React + Vite + ReactFlow (DAG visualisasi) |
| **Auth** | JWT + bcrypt |
| **Real-time** | WebSocket (Socket.io) atau SSE |
| **Container** | Docker + docker-compose |
| **CI/CD** | GitHub Actions |
| **AI Feature** | OpenAI API / Gemini API |

---

## 📅 Jadwal Pengerjaan 4 Hari

---

## ✅ HARI 1 — Fondasi & Setup

### 1. Inisialisasi Repositori Git
- [ ] Buat repository baru di GitHub (misal: `forgeflow`)
- [ ] Init git: `git init`
- [ ] Buat `.gitignore` (Node.js / Go template)
- [ ] Commit pertama: `chore: initial project setup`
- [ ] Buat branch `develop` dan gunakan sebagai base branch
- [ ] Buat branch fitur pertama: `git checkout -b feat/project-foundation`

### 2. Setup Struktur Folder Project
```
forgeflow/
├── backend/
│   ├── src/
│   │   ├── core/          # DAG engine, execution logic
│   │   ├── api/           # Route handlers
│   │   ├── middlewares/   # Auth, rate limiting, validation
│   │   ├── models/        # DB models/schema
│   │   ├── services/      # Business logic
│   │   ├── workers/       # Job processors
│   │   └── utils/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── migrations/        # SQL migration files
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── stores/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
├── README.md
└── REVIEW.md
```

### 3. Setup Backend Project
- [ ] `npm init` atau `go mod init`
- [ ] Install dependencies utama:
  - Express/Fastify, Prisma/Knex, BullMQ, ioredis, jsonwebtoken, bcrypt, zod (validasi), winston (logging)
- [ ] Buat file `.env.example`
- [ ] Setup ESLint + Prettier

### 4. Setup Database PostgreSQL + Redis
- [ ] Buat `docker-compose.yml` awal dengan service: `postgres`, `redis`
- [ ] Jalankan: `docker-compose up -d`

### 5. Design & Implementasi Database Schema
- [ ] **Tabel: `tenants`** — id, name, slug, created_at
- [ ] **Tabel: `users`** — id, tenant_id, email, password_hash, role (admin/editor/viewer), created_at
- [ ] **Tabel: `workflow_definitions`** — id, tenant_id, name, description, dag_json, version, created_by, created_at
- [ ] **Tabel: `workflow_versions`** — id, workflow_id, version, dag_json, created_at (untuk rollback)
- [ ] **Tabel: `workflow_runs`** — id, workflow_id, tenant_id, status, triggered_by, started_at, completed_at
- [ ] **Tabel: `step_runs`** — id, run_id, step_id, status, started_at, completed_at, retry_count, output, error
- [ ] **Tabel: `workflow_schedules`** — id, workflow_id, cron_expression, is_active, next_run_at
- [ ] **Tabel: `webhook_triggers`** — id, workflow_id, secret_token, created_at
- [ ] **Tabel: `execution_logs`** — id, run_id, step_run_id, level, message, timestamp (append-only)
- [ ] Tulis migration script pertama (`001_initial_schema.sql`)
- [ ] Commit: `feat: add initial database schema and migration`

---

## ✅ HARI 2 — Backend Core Engine & API

### 6. Workflow Definition & Execution Engine (Bagian A)

#### 6.1 — DAG Parser & Validator
- [ ] Buat modul `core/dag-parser.js`
  - [ ] Fungsi `parseDAG(definition)` — parse JSON ke struktur graph
  - [ ] Fungsi `validateDAG(graph)` — validasi: tidak ada cycle, semua dependency ada
  - [ ] Fungsi `topologicalSort(graph)` — Kahn's Algorithm untuk urutan eksekusi
- [ ] **Tulis unit test** untuk DAG parser (valid DAG, circular dependency, missing node)

#### 6.2 — Execution Engine
- [ ] Buat modul `core/execution-engine.js`
  - [ ] Fungsi `executeWorkflow(runId)` — orchestrate eksekusi step by step
  - [ ] Identifikasi step yang bisa dijalankan **paralel**
  - [ ] Identifikasi step yang harus **sequential**

#### 6.3 — Step Executors (per tipe step)
- [ ] **HTTP Step** — eksekusi HTTP call ke URL yang dikonfigurasi
- [ ] **Script Step** — jalankan script aman (sandboxed)
- [ ] **Delay Step** — wait menggunakan delayed queue job
- [ ] **Conditional Branch Step** — evaluasi kondisi berdasarkan output step sebelumnya

#### 6.4 — Retry Logic & Timeout
- [ ] Implementasi **exponential backoff** retry (1s, 2s, 4s, 8s...)
- [ ] Konfigurasi `max_retries` per step
- [ ] Implementasi **global workflow timeout**
- [ ] **Tulis unit test** untuk retry logic

#### 6.5 — Queue Worker (BullMQ)
- [ ] Setup BullMQ queue: `workflow-queue` dan `step-queue`
- [ ] Buat worker yang memproses job dari queue

### 7. Multi-Tenant API Layer (Bagian B)

#### 7.1 — Authentication & Authorization
- [ ] Endpoint `POST /auth/register`
- [ ] Endpoint `POST /auth/login` — return JWT
- [ ] Middleware `authenticateJWT`
- [ ] Middleware `authorizeRole(roles[])`
- [ ] **Tenant isolation** — query otomatis filter by `tenant_id` dari JWT

#### 7.2 — Workflow CRUD API
- [ ] `GET /api/workflows` — list dengan **pagination** + **filtering**
- [ ] `POST /api/workflows` — buat workflow baru (validasi DAG sebelum simpan)
- [ ] `GET /api/workflows/:id` — detail workflow
- [ ] `PUT /api/workflows/:id` — update (simpan versi lama)
- [ ] `DELETE /api/workflows/:id` — soft delete
- [ ] `GET /api/workflows/:id/versions` — list semua versi
- [ ] `POST /api/workflows/:id/rollback/:version` — rollback ke versi lama

#### 7.3 — Workflow Triggering
- [ ] `POST /api/workflows/:id/trigger` — manual trigger
- [ ] `POST /api/workflows/:id/schedule` — set cron expression
- [ ] `POST /api/webhooks/:token/trigger` — webhook trigger
- [ ] Setup cron scheduler (`node-cron`) untuk scheduled workflows

#### 7.4 — Rate Limiting
- [ ] Middleware rate limiter: 100 req/menit per tenant/IP

#### 7.5 — Input Validation & Sanitization
- [ ] Validasi semua request body dengan **Zod** atau **Joi**
- [ ] Sanitasi input (SQL injection, XSS prevention)

#### 7.6 — Run Management API
- [ ] `GET /api/runs` — list semua run
- [ ] `GET /api/runs/:id` — detail run + step-runs
- [ ] `POST /api/runs/:id/cancel` — batalkan run
- [ ] `GET /api/runs/:id/logs` — ambil logs

#### 7.7 — (Bonus) GraphQL Endpoint
- [ ] Setup Apollo Server / GraphQL Yoga
- [ ] Definisikan schema GraphQL

#### 7.8 — Query Optimization
- [ ] Tambahkan **index** di kolom: `tenant_id`, `workflow_id`, `status`, `started_at`
- [ ] Analisis query kompleks dengan `EXPLAIN ANALYZE`
- [ ] Dokumentasikan di README

---

## ✅ HARI 3 — Frontend Dashboard & Real-Time

### 8. Setup Frontend Project
- [ ] `npm create vite@latest frontend -- --template react`
- [ ] Install: `@xyflow/react`, `socket.io-client`, `react-query`, `recharts`, Axios, React Router

### 9. Autentikasi Frontend
- [ ] Halaman **Login** — form login, simpan JWT
- [ ] Route guard — redirect ke login jika belum auth
- [ ] Axios interceptor — sertakan JWT di header

### 10. Real-Time Backend (WebSocket / SSE)
- [ ] Setup Socket.io di backend
- [ ] Emit event saat status berubah: `step:started`, `step:completed`, `step:failed`, `run:completed`
- [ ] Broadcast hanya ke tenant yang relevan

### 11. Halaman Dashboard Utama
- [ ] **Global Health Panel**: total active runs, success rate, average execution time, failure rate
- [ ] **Recent Runs** — tabel run terbaru

### 12. Halaman Daftar Workflow
- [ ] List workflow + filter + pagination
- [ ] Tombol: Buat, Trigger, Edit, Hapus

### 13. Halaman Detail Workflow — DAG Visualizer
- [ ] Render **DAG visual** dengan ReactFlow
- [ ] Warna node real-time: abu-abu (pending), biru (running), hijau (success), merah (failed)
- [ ] Update live via WebSocket/SSE
- [ ] Panel detail step yang dipilih

### 14. Halaman Run History
- [ ] List semua run + filter
- [ ] Log per step (timestamp, level, pesan)

### 15. Optimistic UI & Client-Side Caching
- [ ] Cache response API dengan React Query
- [ ] Optimistic update saat trigger workflow

---

## ✅ HARI 4 — AI Feature, Infrastructure, Testing & Dokumentasi

### 16. AI-Powered Feature (Bagian G)
> **Pilihan: Natural Language Workflow Builder**

- [ ] Endpoint `POST /api/ai/generate-workflow`
  - Input: `{ "description": "Send email when form submitted..." }`
  - Kirim ke OpenAI/Gemini dengan **system prompt** format DAG JSON yang valid
  - **Validasi output LLM** — parse JSON, jalankan `validateDAG()`, retry jika gagal (max 3x)
  - Handle **token limit** — truncate jika description terlalu panjang
- [ ] Komponen UI "AI Workflow Builder"
- [ ] Dokumentasikan: prompt engineering approach, token handling, guard malformed output

### 17. Infrastructure & Docker (Bagian E)

#### 17.1 — Dockerfile Backend (Multi-stage)
- [ ] Stage Build: install deps + compile
- [ ] Stage Production: hanya copy artifact final

#### 17.2 — docker-compose.yml Lengkap
- [ ] Services: `api`, `frontend`, `postgres`, `redis`, `worker`
- [ ] Volumes, networks, env_file, health checks, depends_on

#### 17.3 — CI Pipeline (.github/workflows/ci.yml)
- [ ] Job: **Lint** (ESLint)
- [ ] Job: **Test** (unit + integration dengan PG & Redis service)
- [ ] Job: **Build** (Docker image)
- [ ] Job: **Artifact** (upload build)

#### 17.4 — Infrastructure Design Document
- [ ] Buat `INFRASTRUCTURE.md`:
  - Load Balancer → ECS/GKE → RDS → ElastiCache
  - S3/GCS untuk log storage
  - Auto-scaling policy
  - Diagram arsitektur (Mermaid/ASCII)

### 18. Testing Lengkap (Bagian F)

#### 18.1 — Unit Tests
- [ ] DAG Parser: valid, circular dep, missing node, empty
- [ ] Execution Engine: urutan eksekusi, retry logic, timeout

#### 18.2 — Integration Tests (supertest)
- [ ] Auth, Workflow CRUD, Run management
- [ ] **Multi-tenant isolation test**

#### 18.3 — End-to-End Test
1. Register tenant + user
2. Login → JWT
3. Buat workflow 3 step (HTTP → Delay → HTTP)
4. Trigger workflow
5. Poll sampai completed
6. Verifikasi log tersimpan

### 19. Code Review Exercise (Bagian F)
- [ ] Buat file `REVIEW.md`
- [ ] Review flawed code snippet seperti PR review sungguhan:
  - Identifikasi bug / security issue
  - Saran perbaikan + code example
  - Pertanyaan klarifikasi

### 20. README.md Lengkap (Bagian F)
- [ ] Setup Instructions (docker-compose, env, migration)
- [ ] Architecture Overview
- [ ] API Documentation
- [ ] Trade-offs & Improvements
- [ ] AI Feature: prompt engineering approach

### 21. Git History & Pull Request (Bagian F)
- [ ] Semua commit atomic dan meaningful
- [ ] Buat PR dari feature branch ke `develop`
- [ ] PR description lengkap (apa yang diubah, cara test, screenshot)

---

## 📋 Checklist Final Sebelum Submit

- [ ] `docker-compose up` berjalan tanpa error
- [ ] Semua endpoint API berfungsi
- [ ] Dashboard real-time update saat workflow dijalankan
- [ ] DAG visualizer menampilkan workflow dengan benar
- [ ] AI feature generate workflow dari natural language
- [ ] Semua unit test pass: `npm test`
- [ ] CI pipeline berhasil di GitHub Actions
- [ ] README.md lengkap
- [ ] REVIEW.md terisi
- [ ] INFRASTRUCTURE.md ada dengan diagram
- [ ] Git history rapi dengan branch dan PR

---

## 🏆 Aspek Evaluasi

| Aspek | Yang Dinilai |
|-------|-------------|
| **Kebenaran** | Apakah fitur benar-benar bekerja? |
| **Arsitektur** | Keputusan desain yang masuk akal dan skalabel |
| **Kualitas Kode** | Bersih, readable, DRY |
| **Keamanan** | Validasi input, tenant isolation, JWT benar |
| **Pengujian** | Coverage unit, integrasi, dan E2E |
| **Operasional** | Docker jalan, CI hijau, dokumentasi jelas |

---

## 🔗 Referensi Berguna

- [ReactFlow / @xyflow/react](https://reactflow.dev/) — DAG visualizer
- [BullMQ Docs](https://docs.bullmq.io/) — job queue
- [Kahn's Algorithm (Topological Sort)](https://en.wikipedia.org/wiki/Topological_sorting)
- [OpenAI API Docs](https://platform.openai.com/docs) — AI feature
- [Prisma ORM](https://www.prisma.io/docs) — database schema & migration
