# NGINX + Node.js Horizontal Scaling

A simple Express.js server scaled horizontally using NGINX as a load balancer, all orchestrated with Docker Compose.

---

## How It Works

```
                          ┌─────────────────────────────────────────────┐
                          │            docker-compose network            │
                          │                                              │
   You (Browser/curl)     │   ┌─────────────────────────────────────┐   │
         │                │   │         NGINX  (port 80)             │   │
         │  HTTP Request  │   │         Load Balancer                │   │
         └──────────────► │   └──────────────┬──────────────────────┘   │
                          │                  │                           │
                          │       Round Robin│Distribution               │
                          │                  │                           │
                          │    ┌─────────────┼─────────────┐             │
                          │    │             │             │             │
                          │    ▼             ▼             ▼             │
                          │ ┌──────┐     ┌──────┐     ┌──────┐          │
                          │ │node1 │     │node2 │     │node3 │          │
                          │ │:3000 │     │:3000 │     │:3000 │          │
                          │ └──────┘     └──────┘     └──────┘          │
                          │  node-app    node-app      node-app          │
                          │  (image)     (image)       (image)           │
                          └─────────────────────────────────────────────┘
```

### Round Robin — Request by Request

```
Request 1  ──►  NGINX  ──►  node1  (pid: 101)
Request 2  ──►  NGINX  ──►  node2  (pid: 202)
Request 3  ──►  NGINX  ──►  node3  (pid: 303)
Request 4  ──►  NGINX  ──►  node1  (pid: 101)  ← back to start
Request 5  ──►  NGINX  ──►  node2  (pid: 202)
Request 6  ──►  NGINX  ──►  node3  (pid: 303)
    ...              repeats forever
Request N  ──►  NGINX  ──►  node(N % 3)        ← always cycles 1 → 2 → 3
```

- NGINX receives all incoming traffic and distributes it evenly across 3 Node.js containers
- All 3 Node containers share a **single Docker image** called `node-app`
- Each container is an independent process running from the same image
- Every response returns a different `pid` — proof that a different container handled the request

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

## NGINX Config Explained (`nginx.conf`)

```nginx
events {}  # Required block — handles connection processing (empty = use defaults)
```
- Every `nginx.conf` must have an `events` block
- Leaving it empty tells NGINX to use its default connection handling settings
- **Why:** Without this block, NGINX will throw a config error and refuse to start

---

```nginx
http {
```
- Opens the `http` block — everything related to HTTP traffic is defined inside here
- **Why:** NGINX can also handle TCP/UDP (in a `stream` block), so we explicitly tell it this is HTTP traffic

---

```nginx
  upstream node_cluster {
    server node1:3000;
    server node2:3000;
    server node3:3000;
  }
```
- `upstream` — defines a named group of backend servers called `node_cluster`
- `node1`, `node2`, `node3` — these are Docker service names, Docker's internal DNS resolves them to each container's IP automatically
- `:3000` — the port each Node container is listening on inside the Docker network
- No algorithm specified — defaults to **round-robin** (requests distributed 1 → 2 → 3 → 1 → 2 → 3...)
- **Why:** Grouping servers under one name lets NGINX treat them as a single unit and load balance across them

---

```nginx
  server {
    listen 80;
```
- `server` — defines a virtual server (like a website config)
- `listen 80` — NGINX listens for incoming HTTP traffic on port 80
- **Why:** Port 80 is the default HTTP port — browsers and `curl http://localhost` hit this automatically without needing to specify a port

---

```nginx
    location / {
```
- `location /` — matches ALL incoming request paths (e.g. `/`, `/api`, `/anything`)
- **Why:** We want every request forwarded to Node, so we catch everything with `/`

---

```nginx
      proxy_pass http://node_cluster;
```
- Forwards the incoming request to one of the servers in the `node_cluster` upstream group
- NGINX picks which Node container to send it to using round-robin
- **Why:** This is the core of load balancing — NGINX acts as a middleman between the client and Node containers

---

```nginx
      proxy_set_header Host $host;
```
- Passes the original `Host` header from the client request to the Node server
- `$host` — NGINX variable that holds the hostname from the incoming request (e.g. `localhost`)
- **Why:** Without this, Node would see NGINX's internal hostname instead of the original one the client used

---

```nginx
      proxy_set_header X-Real-IP $remote_addr;
```
- Passes the real client IP address to the Node server
- `$remote_addr` — NGINX variable that holds the actual IP of the client making the request
- **Why:** Without this, Node would see NGINX's container IP as the requester instead of the real client IP — important for logging and security

---

## Why Node Ports Are Not Visible in `docker ps`

When you run `docker ps`, you'll notice Node containers show no ports:

```
NAMES   IMAGE        PORTS
nginx   nginx:alpine 0.0.0.0:80->80/tcp   ← exposed to host
node1   node-app                          ← no port shown
node2   node-app                          ← no port shown
node3   node-app                          ← no port shown
```

This is intentional. Here's why:

```
Your Machine (Host)
      |
      | port 80 only
      v
   NGINX container          ← only NGINX is exposed to host
      |
      | internal Docker network (no host access)
      |
   node1:3000
   node2:3000
   node3:3000
```

- Only `nginx` has `ports: "80:80"` in `docker-compose.yml` — that maps host → container
- Node containers have no `ports:` defined — they are intentionally private
- NGINX talks to them via Docker's internal network using service names (`node1`, `node2`, `node3`)
- Clients should never talk directly to Node containers — only through NGINX
- **Why:** If Node ports were exposed, anyone could bypass NGINX and hit them directly, defeating the purpose of the load balancer

To confirm Node containers are reachable internally, run:

```bash
docker exec nginx curl http://node1:3000
docker exec nginx curl http://node2:3000
docker exec nginx curl http://node3:3000
```

Each should return a response with a different `pid`.

---

## Why Horizontal Scaling?

| Vertical Scaling | Horizontal Scaling |
|---|---|
| Add more CPU/RAM to one server | Add more server instances |
| Has a hardware limit | Scales infinitely |
| Single point of failure | If one instance dies, others keep running |
| Expensive at scale | Cost-efficient with containers |

NGINX makes horizontal scaling possible here by acting as the single entry point that evenly distributes traffic across all Node instances — no client ever talks directly to a Node container.
