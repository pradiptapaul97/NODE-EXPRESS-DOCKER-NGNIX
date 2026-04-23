# NGINX + Node.js Horizontal Scaling

A simple Express.js server scaled horizontally using NGINX as a load balancer, all orchestrated with Docker Compose.

---

## How It Works

```
Client Request
      |
      v
  NGINX :80  (Load Balancer)
      |
      |--- Round Robin --->  node1:3000
      |                      node2:3000
      |                      node3:3000
```

- NGINX receives all incoming traffic and distributes it evenly across 3 Node.js containers
- All 3 Node containers share a **single Docker image** called `node-app`
- Each container is an independent process running from the same image

---

## Project Structure

```
NGINX-NODE/
├── server.js            # Express application
├── package.json         # Node dependencies
├── Dockerfile           # Instructions to containerize the Node app
├── nginx.conf           # NGINX load balancer configuration
└── docker-compose.yml   # Orchestrates all containers together
```

---

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop)
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

---

## Commands

### 1. Build and Start the Project

```bash
docker-compose up --build -d
```

- `up` — starts all services defined in `docker-compose.yml`
- `--build` — builds the `node-app` image from the `Dockerfile` (only built once, shared across node1/node2/node3)
- `-d` — runs all containers in the background (detached mode)
- **Why:** First time setup or after any code change — rebuilds the shared image and starts all 4 containers (3 Node + 1 NGINX)

---

### 2. Check Running Containers

```bash
docker-compose ps
```

- Lists all containers with their name, status, and ports
- **Why:** Confirm that `node1`, `node2`, `node3`, and `nginx` are all running before testing
- Expected output:
```
NAME      STATUS    PORTS
node1     running   3000/tcp
node2     running   3000/tcp
node3     running   3000/tcp
nginx     running   0.0.0.0:80->80/tcp
```

---

### 3. Test Load Balancing

```bash
curl http://localhost
```

- Sends an HTTP GET request to NGINX on port 80
- NGINX forwards it to one of the Node containers via round-robin
- **Why:** Run this multiple times — each response will show a different `pid` (process ID), proving that different containers are handling your requests
- Expected output:
```json
{ "message": "Hello from Node!", "pid": 1, "port": "3000" }
```

---

### 4. Scale Up Node Instances

```bash
docker-compose up --scale node1=5 -d
```

- `--scale node1=5` — spins up 5 instances of the `node1` service
- All 5 instances use the same `node-app` image — no extra builds needed
- **Why:** Simulate higher traffic — more instances means more requests handled in parallel, this is the core idea of horizontal scaling

---

### 5. View Logs of All Containers

```bash
docker-compose logs -f
```

- `logs` — prints stdout of all running containers
- `-f` — streams logs in real time
- **Why:** See which Node instance is receiving each request and debug errors across all services at once

---

### 6. View Logs of a Specific Container

```bash
docker-compose logs -f node1
docker-compose logs -f nginx
```

- Filters logs to only show output from the specified container
- **Why:** Isolate and debug a specific container without noise from others

---

### 7. Stop All Containers (Keep Data)

```bash
docker-compose stop
```

- Stops all running containers but does NOT remove them
- **Why:** Pause the project and restart it later quickly without rebuilding

---

### 8. Restart All Containers

```bash
docker-compose restart
```

- Restarts all containers without rebuilding images
- **Why:** Apply config changes (like `nginx.conf`) without a full rebuild

---

### 9. Stop and Remove Everything

```bash
docker-compose down
```

- Stops and removes all containers and the default network
- **Why:** Clean shutdown — use this when done or before a fresh start

---

### 10. Remove Everything Including Images

```bash
docker-compose down --rmi all
```

- `--rmi all` — also deletes the `node-app` image and `nginx:alpine` image
- **Why:** Full cleanup — frees disk space and ensures the next `--build` starts completely fresh

---

### 11. Check Resource Usage

```bash
docker stats
```

- Shows real-time CPU, memory, and network usage per container
- **Why:** Monitor how each Node instance performs under load and spot any overloaded container

---

## Full Workflow (Start to Finish)

```bash
# Step 1 — Build the shared node-app image and start all containers
docker-compose up --build -d

# Step 2 — Confirm all 4 containers are running
docker-compose ps

# Step 3 — Hit the server multiple times to see load balancing in action
curl http://localhost
curl http://localhost
curl http://localhost

# Step 4 — Scale up to handle more traffic (all instances reuse the same image)
docker-compose up --scale node1=5 -d

# Step 5 — Monitor logs across all containers
docker-compose logs -f

# Step 6 — Shut everything down when done
docker-compose down
```

---

## Shared Image vs Separate Images

| Separate Images (old) | Shared Image (current) |
|---|---|
| Each service builds its own image | All 3 Node containers use one `node-app` image |
| 3 builds on every `--build` | 1 build, reused 3 times |
| More disk space used | Efficient — image layers shared |
| Harder to manage updates | Update once, all containers get the change |

---

## Why Horizontal Scaling?

| Vertical Scaling | Horizontal Scaling |
|---|---|
| Add more CPU/RAM to one server | Add more server instances |
| Has a hardware limit | Scales infinitely |
| Single point of failure | If one instance dies, others keep running |
| Expensive at scale | Cost-efficient with containers |

NGINX makes horizontal scaling possible here by acting as the single entry point that evenly distributes traffic across all Node instances — no client ever talks directly to a Node container.
