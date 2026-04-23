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

NGINX receives all incoming traffic and distributes it evenly across 3 Node.js containers.
Each container is an identical copy of the same Express app running as an independent process.

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

Make sure you have these installed before running anything:

- [Docker](https://www.docker.com/products/docker-desktop)
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

---

## Commands

### 1. Build and Start the Project

```bash
docker-compose up --build
```

- `docker-compose up` — starts all services defined in `docker-compose.yml`
- `--build` — forces Docker to rebuild the Node.js image from the `Dockerfile`
- **Why:** First time setup or after any code change, you need to rebuild the image so the latest code is packaged into the container

---

### 2. Run in Background (Detached Mode)

```bash
docker-compose up --build -d
```

- `-d` — runs all containers in the background (detached mode)
- **Why:** Frees up your terminal so you can run other commands while the project is running

---

### 3. Check Running Containers

```bash
docker-compose ps
```

- Lists all containers managed by this `docker-compose.yml` with their status and ports
- **Why:** Verify that all 3 Node instances and NGINX are actually running before testing

---

### 4. Test Load Balancing

```bash
curl http://localhost
```

- Sends an HTTP GET request to NGINX on port 80
- NGINX forwards it to one of the Node containers via round-robin
- **Why:** Run this multiple times — each response will show a different `pid` (process ID), proving that different containers are handling your requests

---

### 5. Scale Up Node Instances

```bash
docker-compose up --scale node1=5 --build
```

- `--scale node1=5` — spins up 5 instances of the `node1` service instead of 1
- **Why:** Simulate higher traffic load — more instances means more requests can be handled in parallel, this is the core idea of horizontal scaling

---

### 6. View Logs of All Containers

```bash
docker-compose logs -f
```

- `logs` — prints the output (stdout) of all running containers
- `-f` — follows/streams logs in real time (like `tail -f`)
- **Why:** See which Node instance is receiving requests and debug any errors across all services at once

---

### 7. View Logs of a Specific Service

```bash
docker-compose logs -f node1
docker-compose logs -f nginx
```

- Filters logs to only show output from `node1` or `nginx`
- **Why:** Useful when you want to isolate and debug a specific container without noise from others

---

### 8. Stop All Containers (Keep Data)

```bash
docker-compose stop
```

- Stops all running containers but does NOT remove them
- **Why:** Use this when you want to pause the project and restart it later quickly without rebuilding

---

### 9. Restart All Containers

```bash
docker-compose restart
```

- Restarts all containers without rebuilding the images
- **Why:** Useful when you've changed a config file (like `nginx.conf`) and need to apply changes without a full rebuild

---

### 10. Stop and Remove Everything

```bash
docker-compose down
```

- Stops all containers AND removes them along with the default network
- **Why:** Clean shutdown — use this when you are done with the project or want a completely fresh start on next `up`

---

### 11. Remove Everything Including Images

```bash
docker-compose down --rmi all
```

- `--rmi all` — also deletes all Docker images built for this project
- **Why:** Full cleanup — frees up disk space and ensures the next `up --build` starts from a completely clean state

---

### 12. Check Resource Usage

```bash
docker stats
```

- Shows real-time CPU, memory, and network usage for all running containers
- **Why:** Monitor how each Node instance is performing under load and identify if any container is being overloaded

---

## Full Workflow (Start to Finish)

```bash
# Step 1 — Build and start all containers
docker-compose up --build -d

# Step 2 — Confirm everything is running
docker-compose ps

# Step 3 — Hit the server multiple times to see load balancing in action
curl http://localhost
curl http://localhost
curl http://localhost

# Step 4 — Scale up to handle more traffic
docker-compose up --scale node1=5 -d

# Step 5 — Monitor logs
docker-compose logs -f

# Step 6 — Shut everything down when done
docker-compose down
```

---

## Why Horizontal Scaling?

| Vertical Scaling | Horizontal Scaling |
|---|---|
| Add more CPU/RAM to one server | Add more server instances |
| Has a hardware limit | Scales infinitely |
| Single point of failure | If one instance dies, others keep running |
| Expensive at scale | Cost-efficient with containers |

NGINX makes horizontal scaling possible here by acting as the single entry point that evenly distributes traffic across all Node instances — no client ever talks directly to a Node container.
