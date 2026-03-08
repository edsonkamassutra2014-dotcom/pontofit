import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("pontocfit.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT UNIQUE,
    password TEXT,
    weight REAL,
    height REAL,
    age INTEGER,
    goal TEXT,
    role TEXT DEFAULT 'student',
    instructor_id INTEGER,
    photo TEXT,
    registration_number TEXT UNIQUE
  );

  -- Add columns if they don't exist (SQLite doesn't support IF NOT EXISTS for columns in ALTER TABLE directly)
  -- We'll try to add them and catch errors or just use a PRAGMA check
`);

// Migration: Add columns if they don't exist
try {
  db.exec("ALTER TABLE users ADD COLUMN photo TEXT;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN registration_number TEXT UNIQUE;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN instructor_id INTEGER;");
} catch (e) {}
try {
  db.exec("ALTER TABLE trainer_notifications ADD COLUMN is_read BOOLEAN DEFAULT 0;");
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT, -- 'run', 'bodybuilding'
    data TEXT, -- JSON string of activity details
    calories REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    target_value INTEGER,
    type TEXT -- 'workouts_per_week', 'distance_km'
  );

  CREATE TABLE IF NOT EXISTS user_challenges (
    user_id INTEGER,
    challenge_id INTEGER,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT 0,
    PRIMARY KEY (user_id, challenge_id)
  );

  CREATE TABLE IF NOT EXISTS trainers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    trainer_code TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS trainer_students (
    trainer_id INTEGER,
    student_id INTEGER,
    PRIMARY KEY (trainer_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS trainer_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER,
    student_id INTEGER,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trainer_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER,
    message TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS gyms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    location TEXT,
    owner_id INTEGER,
    gym_code TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS gym_members (
    gym_id INTEGER,
    user_id INTEGER,
    PRIMARY KEY (gym_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS gym_competitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    start_date DATETIME,
    end_date DATETIME,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS gym_scores (
    competition_id INTEGER,
    gym_id INTEGER,
    score REAL DEFAULT 0,
    PRIMARY KEY (competition_id, gym_id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER,
    name TEXT,
    description TEXT,
    price REAL,
    photo TEXT,
    stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id INTEGER,
    product_id INTEGER,
    seller_id INTEGER,
    price REAL,
    platform_commission REAL,
    seller_amount REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial challenge if empty
const challengeCount = db.prepare("SELECT COUNT(*) as count FROM challenges").get() as { count: number };
if (challengeCount.count === 0) {
  db.prepare("INSERT INTO challenges (title, description, target_value, type) VALUES (?, ?, ?, ?)").run(
    "Guerreiro da Semana",
    "Complete 3 treinos nesta semana",
    3,
    "workouts_per_week"
  );
}

// Fill in missing registration numbers for existing users
try {
  const usersWithoutReg = db.prepare("SELECT id FROM users WHERE registration_number IS NULL").all() as { id: number }[];
  for (const user of usersWithoutReg) {
    const regNum = `PF-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      db.prepare("UPDATE users SET registration_number = ? WHERE id = ?").run(regNum, user.id);
    } catch (e) {
      // Handle potential collision
      const regNum2 = `PF-${Math.floor(1000 + Math.random() * 9000)}`;
      db.prepare("UPDATE users SET registration_number = ? WHERE id = ?").run(regNum2, user.id);
    }
  }
} catch (e) {
  console.error("Migration failed", e);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(express.static("public"));
  const PORT = process.env.PORT || 3000;

  const authenticateUser = (req: any, res: any, next: any) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: "Não autenticado" });
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(401).json({ error: "Usuário não encontrado" });
    req.user = user;
    next();
  };

  const requireTrainer = (req: any, res: any, next: any) => {
    if (req.user.role !== "trainer") {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };

  // API Routes
  app.post("/api/auth/register", (req, res) => {
    const { name, phone, password, role, photo } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: "Nome, telefone e senha são obrigatórios" });
    }
    const regNum = `PF-${Math.floor(1000 + Math.random() * 9000)}`;
    const userRole = role || 'student';
    try {
      const registerUser = db.transaction(() => {
        const info = db.prepare("INSERT INTO users (name, phone, password, role, registration_number, photo) VALUES (?, ?, ?, ?, ?, ?)").run(name, phone, password, userRole, regNum, photo || null);
        const userId = info.lastInsertRowid;
        
        if (userRole === 'trainer') {
          const trainerCode = `TR-${Math.floor(10000 + Math.random() * 90000)}`;
          db.prepare("INSERT INTO trainers (user_id, trainer_code) VALUES (?, ?)").run(userId, trainerCode);
        }
        
        return userId;
      });
      
      const userId = registerUser();
      res.json({ id: userId, name, phone, role: userRole, registration_number: regNum, photo });
    } catch (e: any) {
      console.error("Register error:", e);
      if (e.message && e.message.includes("UNIQUE constraint failed: users.phone")) {
        res.status(400).json({ error: "Telefone já cadastrado" });
      } else {
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    }
  });

  app.post("/api/instructor/register-student", authenticateUser, requireTrainer, (req, res) => {
    const { name, phone, password, instructor_id, photo } = req.body;
    if (!name || !phone || !password || !instructor_id) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }
    const regNum = `PF-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const info = db.prepare("INSERT INTO users (name, phone, password, role, instructor_id, registration_number, photo) VALUES (?, ?, ?, 'student', ?, ?, ?)").run(name, phone, password, instructor_id, regNum, photo || null);
      
      // Create notification for the instructor
      db.prepare("INSERT INTO trainer_notifications (trainer_id, message) VALUES (?, ?)").run(instructor_id, `Novo aluno cadastrado: ${name}`);
      
      res.json({ id: info.lastInsertRowid, name, phone, role: 'student', instructor_id, registration_number: regNum, photo });
    } catch (e: any) {
      console.error("Register student error:", e);
      if (e.message && e.message.includes("UNIQUE constraint failed: users.phone")) {
        res.status(400).json({ error: "Telefone já cadastrado" });
      } else {
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    }
  });

  app.get("/api/instructor/students/:instructorId", authenticateUser, requireTrainer, (req, res) => {
    const students = db.prepare("SELECT id, name, phone, weight, height, age, goal FROM users WHERE instructor_id = ?").all(req.params.instructorId);
    res.json(students);
  });

  app.get("/api/student/evolution/:studentId", authenticateUser, requireTrainer, (req, res) => {
    const activities = db.prepare("SELECT * FROM activities WHERE user_id = ? ORDER BY timestamp DESC").all(req.params.studentId);
    res.json(activities);
  });

  app.post("/api/auth/login", (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: "Telefone e senha são obrigatórios" });
    }
    try {
      const user = db.prepare("SELECT * FROM users WHERE phone = ? AND password = ?").get(phone, password);
      if (user) {
        res.json(user);
      } else {
        res.status(401).json({ error: "Credenciais inválidas" });
      }
    } catch (e) {
      console.error("Login error:", e);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.put("/api/user/profile", (req, res) => {
    const { id, weight, height, age, goal, photo } = req.body;
    if (photo) {
      db.prepare("UPDATE users SET weight = ?, height = ?, age = ?, goal = ?, photo = ? WHERE id = ?").run(weight, height, age, goal, photo, id);
    } else {
      db.prepare("UPDATE users SET weight = ?, height = ?, age = ?, goal = ? WHERE id = ?").run(weight, height, age, goal, id);
    }
    res.json({ success: true });
  });

  app.get("/api/activities/:userId", (req, res) => {
    const activities = db.prepare("SELECT * FROM activities WHERE user_id = ? ORDER BY timestamp DESC").all(req.params.userId);
    res.json(activities);
  });

  app.post("/api/activities", (req, res) => {
    const { user_id, type, data, calories } = req.body;
    db.prepare("INSERT INTO activities (user_id, type, data, calories) VALUES (?, ?, ?, ?)").run(user_id, type, JSON.stringify(data), calories);
    
    // Update challenge progress if applicable
    const activeChallenge = db.prepare("SELECT * FROM challenges LIMIT 1").get() as any;
    if (activeChallenge && activeChallenge.type === 'workouts_per_week') {
      const userChallenge = db.prepare("SELECT * FROM user_challenges WHERE user_id = ? AND challenge_id = ?").get(user_id, activeChallenge.id) as any;
      if (!userChallenge) {
        db.prepare("INSERT INTO user_challenges (user_id, challenge_id, progress) VALUES (?, ?, 1)").run(user_id, activeChallenge.id);
      } else {
        const newProgress = userChallenge.progress + 1;
        const completed = newProgress >= activeChallenge.target_value;
        db.prepare("UPDATE user_challenges SET progress = ?, completed = ? WHERE user_id = ? AND challenge_id = ?").run(newProgress, completed ? 1 : 0, user_id, activeChallenge.id);
      }
    }

    res.json({ success: true });
  });

  app.get("/api/dashboard/:userId", (req, res) => {
    const userId = req.params.userId;
    const stats = db.prepare(`
      SELECT 
        SUM(calories) as total_calories,
        COUNT(*) as total_workouts
      FROM activities 
      WHERE user_id = ? AND timestamp >= date('now', '-7 days')
    `).get(userId) as any;

    const challenge = db.prepare(`
      SELECT c.*, uc.progress, uc.completed 
      FROM challenges c 
      LEFT JOIN user_challenges uc ON c.id = uc.challenge_id AND uc.user_id = ?
      LIMIT 1
    `).get(userId) as any;

    let ranking = [];
    try {
      ranking = db.prepare(`
        SELECT u.name, u.photo, u.registration_number, SUM(a.calories) as score
        FROM users u
        JOIN activities a ON u.id = a.user_id
        GROUP BY u.id
        ORDER BY score DESC
        LIMIT 10
      `).all();
    } catch (e) {
      console.error("Ranking query failed", e);
    }

    res.json({ stats, challenge, ranking });
  });

  // --- Trainer Routes ---
  app.get("/api/trainer/:userId", (req, res) => {
    const trainer = db.prepare("SELECT * FROM trainers WHERE user_id = ?").get(req.params.userId);
    res.json(trainer || null);
  });

  app.post("/api/student/join-trainer", (req, res) => {
    const { student_id, trainer_code } = req.body;
    const trainer = db.prepare("SELECT * FROM trainers WHERE trainer_code = ?").get(trainer_code) as any;
    if (trainer) {
      try {
        db.prepare("INSERT INTO trainer_students (trainer_id, student_id) VALUES (?, ?)").run(trainer.id, student_id);
        db.prepare("UPDATE users SET instructor_id = ? WHERE id = ?").run(trainer.user_id, student_id); // Keep backward compatibility
        
        // Get student info for notification
        const student = db.prepare("SELECT name FROM users WHERE id = ?").get(student_id) as any;
        db.prepare("INSERT INTO trainer_notifications (trainer_id, message) VALUES (?, ?)").run(trainer.user_id, `Novo aluno vinculado via código: ${student?.name || 'Desconhecido'}`);
        
        res.json({ success: true });
      } catch (e) {
        res.status(400).json({ error: "Já está vinculado a este treinador" });
      }
    } else {
      res.status(404).json({ error: "Código de treinador inválido" });
    }
  });

  app.get("/api/trainer/students-list/:trainerId", authenticateUser, requireTrainer, (req, res) => {
    const students = db.prepare(`
      SELECT u.id, u.name, u.phone, u.weight, u.height, u.age, u.goal, u.photo
      FROM users u
      JOIN trainer_students ts ON u.id = ts.student_id
      WHERE ts.trainer_id = ?
    `).all(req.params.trainerId);
    res.json(students);
  });

  app.post("/api/trainer/note", authenticateUser, requireTrainer, (req, res) => {
    const { trainer_id, student_id, note } = req.body;
    try {
      db.prepare("INSERT INTO trainer_notes (trainer_id, student_id, note) VALUES (?, ?, ?)").run(trainer_id, student_id, note);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Erro ao enviar nota" });
    }
  });

  app.get("/api/student/notes/:studentId", (req, res) => {
    const notes = db.prepare("SELECT * FROM trainer_notes WHERE student_id = ? ORDER BY created_at DESC").all(req.params.studentId);
    res.json(notes);
  });

  // --- Invite System Routes ---
  app.get("/api/trainer/invite-link/:trainerId", authenticateUser, requireTrainer, (req, res) => {
    try {
      const trainer = db.prepare("SELECT trainer_code FROM trainers WHERE id = ?").get(req.params.trainerId) as any;
      if (!trainer) {
        return res.status(404).json({ error: "Treinador não encontrado" });
      }
      res.json({ invite_link: `/invite/${trainer.trainer_code}` });
    } catch (e) {
      res.status(500).json({ error: "Erro ao gerar link" });
    }
  });

  app.post("/api/invite/join", (req, res) => {
    const { student_id, trainer_code } = req.body;
    if (!student_id || !trainer_code) {
      return res.status(400).json({ error: "ID do aluno e código do treinador são obrigatórios" });
    }

    try {
      const trainer = db.prepare("SELECT id, user_id FROM trainers WHERE trainer_code = ?").get(trainer_code) as any;
      if (!trainer) {
        return res.status(404).json({ error: "Código de treinador inválido" });
      }

      // Create link in trainer_students (ignore if already exists)
      db.prepare("INSERT OR IGNORE INTO trainer_students (trainer_id, student_id) VALUES (?, ?)").run(trainer.id, student_id);

      // Update users.instructor_id
      db.prepare("UPDATE users SET instructor_id = ? WHERE id = ?").run(trainer.user_id, student_id);

      // Create notification
      const student = db.prepare("SELECT name FROM users WHERE id = ?").get(student_id) as any;
      db.prepare("INSERT INTO trainer_notifications (trainer_id, message) VALUES (?, ?)").run(trainer.user_id, `Um novo aluno entrou através do seu link de convite: ${student?.name || 'Desconhecido'}`);

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Erro ao processar convite" });
    }
  });

  // --- Gym Routes ---
  app.post("/api/gym/register", authenticateUser, (req, res) => {
    const { name, location, owner_id } = req.body;
    if (!name || !location || !owner_id) {
      return res.status(400).json({ error: "Nome, localização e ID do dono são obrigatórios" });
    }
    const gymCode = `GYM-${Math.floor(10000 + Math.random() * 90000)}`;
    
    const registerGym = db.transaction((gymName, gymLoc, ownerId, code) => {
      const info = db.prepare("INSERT INTO gyms (name, location, owner_id, gym_code) VALUES (?, ?, ?, ?)").run(gymName, gymLoc, ownerId, code);
      db.prepare("INSERT INTO gym_members (gym_id, user_id) VALUES (?, ?)").run(info.lastInsertRowid, ownerId);
      return info.lastInsertRowid;
    });

    try {
      const gymId = registerGym(name, location, owner_id, gymCode);
      res.json({ success: true, gym_code: gymCode, gym_id: gymId });
    } catch (e: any) {
      console.error("Gym register error:", e);
      res.status(500).json({ error: "Erro interno ao registrar ginásio" });
    }
  });

  app.post("/api/gym/join", (req, res) => {
    const { user_id, gym_code } = req.body;
    const gym = db.prepare("SELECT * FROM gyms WHERE gym_code = ?").get(gym_code) as any;
    if (gym) {
      try {
        db.prepare("INSERT INTO gym_members (gym_id, user_id) VALUES (?, ?)").run(gym.id, user_id);
        res.json({ success: true, gym_id: gym.id });
      } catch (e) {
        res.status(400).json({ error: "Já é membro deste ginásio" });
      }
    } else {
      res.status(404).json({ error: "Código de ginásio inválido" });
    }
  });

  app.get("/api/gym/user/:userId", (req, res) => {
    const gym = db.prepare(`
      SELECT g.* FROM gyms g
      JOIN gym_members gm ON g.id = gm.gym_id
      WHERE gm.user_id = ?
    `).get(req.params.userId);
    res.json(gym || null);
  });

  app.get("/api/gym/:gymId/members", (req, res) => {
    const members = db.prepare(`
      SELECT u.id, u.name, u.photo, u.registration_number, COALESCE(SUM(a.calories), 0) as score
      FROM users u
      JOIN gym_members gm ON u.id = gm.user_id
      LEFT JOIN activities a ON u.id = a.user_id
      WHERE gm.gym_id = ?
      GROUP BY u.id
      ORDER BY score DESC
    `).all(req.params.gymId);
    res.json(members);
  });

  app.get("/api/competitions/ranking", (req, res) => {
    const ranking = db.prepare(`
      SELECT g.id, g.name, COALESCE(SUM(a.calories), 0) as total_score
      FROM gyms g
      JOIN gym_members gm ON g.id = gm.gym_id
      JOIN activities a ON gm.user_id = a.user_id
      WHERE a.timestamp >= date('now', '-7 days')
      GROUP BY g.id
      ORDER BY total_score DESC
    `).all();
    res.json(ranking);
  });

  app.post("/api/competitions", authenticateUser, requireTrainer, (req, res) => {
    const { title, start_date, end_date } = req.body;
    try {
      const info = db.prepare("INSERT INTO gym_competitions (title, start_date, end_date) VALUES (?, ?, ?)").run(title, start_date, end_date);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (e) {
      res.status(500).json({ error: "Erro ao criar competição" });
    }
  });

  // --- Marketplace Routes ---
  app.post("/api/products", authenticateUser, requireTrainer, (req: any, res: any) => {
    const { name, description, price, photo, stock } = req.body;
    const seller_id = req.user.id;
    try {
      const info = db.prepare("INSERT INTO products (seller_id, name, description, price, photo, stock) VALUES (?, ?, ?, ?, ?, ?)").run(seller_id, name, description, price, photo, stock || 0);
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (e) {
      console.error("Add product error:", e);
      res.status(500).json({ error: "Erro ao adicionar produto" });
    }
  });

  app.get("/api/products", (req, res) => {
    try {
      const products = db.prepare("SELECT id, name, description, price, photo, seller_id FROM products").all();
      res.json(products);
    } catch (e) {
      res.status(500).json({ error: "Erro ao listar produtos" });
    }
  });

  app.post("/api/orders", (req, res) => {
    const { buyer_id, product_id } = req.body;
    try {
      const product = db.prepare("SELECT * FROM products WHERE id = ?").get(product_id) as any;
      if (!product) return res.status(404).json({ error: "Produto não encontrado" });
      
      const price = product.price;
      const platform_commission = price * 0.05;
      const seller_amount = price * 0.95;
      
      const info = db.prepare("INSERT INTO orders (buyer_id, product_id, seller_id, price, platform_commission, seller_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)").run(buyer_id, product_id, product.seller_id, price, platform_commission, seller_amount, 'pending');
      
      // Create notification for the seller
      db.prepare("INSERT INTO trainer_notifications (trainer_id, message) VALUES (?, ?)").run(product.seller_id, `Nova compra realizada: ${product.name}`);
      
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (e) {
      console.error("Create order error:", e);
      res.status(500).json({ error: "Erro ao processar compra" });
    }
  });

  app.get("/api/trainer/orders/:trainerId", authenticateUser, requireTrainer, (req: any, res: any) => {
    const trainerId = req.params.trainerId;
    try {
      const orders = db.prepare(`
        SELECT o.*, p.name as product_name 
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE o.seller_id = ?
      `).all(trainerId);
      
      const stats = db.prepare(`
        SELECT 
          SUM(price) as total_sold,
          SUM(platform_commission) as total_commission,
          SUM(seller_amount) as total_received
        FROM orders
        WHERE seller_id = ?
      `).get(trainerId) as any;
      
      res.json({
        orders,
        total_sold: stats?.total_sold || 0,
        total_commission: stats?.total_commission || 0,
        total_received: stats?.total_received || 0
      });
    } catch (e) {
      console.error("Get trainer orders error:", e);
      res.status(500).json({ error: "Erro ao buscar vendas" });
    }
  });

  app.get("/api/trainer/notifications/:trainerId", authenticateUser, requireTrainer, (req: any, res: any) => {
    const trainerId = req.params.trainerId;
    try {
      const notifications = db.prepare("SELECT * FROM trainer_notifications WHERE trainer_id = ? ORDER BY created_at DESC").all(trainerId);
      res.json(notifications);
    } catch (e) {
      res.status(500).json({ error: "Erro ao buscar notificações" });
    }
  });

  app.post("/api/trainer/notifications/:id/read", authenticateUser, requireTrainer, (req: any, res: any) => {
    const id = req.params.id;
    try {
      db.prepare("UPDATE trainer_notifications SET is_read = 1 WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Erro ao atualizar notificação" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
