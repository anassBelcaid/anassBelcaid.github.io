---
layout: post
title: Minimum Cost Path with Teleportations
tags: distill competitive leetcode dp dijkstra
giscus_comments: true
date: 2026-01-28
featured: true
mermaid:
  enabled: true
  zoomable: true
code_diff: true
map: true
authors:
  - name: A.Belcaid
    affiliations:
      name: ENSA, Tetouan
---

## The Problem

In this post, we tackle a complex shortest-path problem on a grid. Unlike standard grid DP problems where you only move right or down, this challenge introduces arbitrary movement and "wormholes."

The goal is to reach $(m-1, n-1)$ from $(0, 0)$ with the lowest cost.

### Movement Rules
1. **Adjacent Moves**: Move Up, Down, Left, or Right. Cost = `grid[new_row][new_col]`.
2. **Teleportation**: Use a jump from $(r1, c1)$ to $(r2, c2)$ with a fixed cost. You can use at most $k$ teleports.

---

## Visualizing the Optimal Path

Below is a visualization of the grid `[[1,3,3],[2,5,4],[4,3,5]]` with $k=1$. The path highlights how skipping expensive cells via teleportation can optimize the total cost.

<div class="grid-container" style="display: flex; flex-direction: column; align-items: center; font-family: 'Source Code Pro', monospace; margin: 30px 0; background: #fdfdfd; padding: 20px; border-radius: 12px; border: 1px solid #eee;">
    <style>
        .leetcode-grid {
            display: grid;
            grid-template-columns: repeat(3, 70px);
            grid-template-rows: repeat(3, 70px);
            gap: 12px;
            position: relative;
        }
        .cell {
            width: 70px;
            height: 70px;
            border: 1px solid #d1d5db;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: #ffffff;
            z-index: 2;
            transition: all 0.3s ease;
        }
        .cell-cost { font-size: 20px; font-weight: 700; color: #374151; }
        .cell-coord { font-size: 10px; color: #9ca3af; margin-top: 4px; }
        .path-highlight { border: 3px solid #10b981 !important; background: #ecfdf5; transform: scale(1.05); }
        .start-node { background: #eff6ff; border-color: #3b82f6; }
        .end-node { background: #faf5ff; border-color: #a855f7; }
        .teleport-line {
            stroke: #f59e0b;
            stroke-width: 3;
            stroke-dasharray: 8;
            fill: none;
            marker-end: url(#arrowhead);
            animation: dash 2s linear infinite;
        }
        @keyframes dash {
            to { stroke-dashoffset: -16; }
        }
        .walk-line {
            stroke: #10b981;
            stroke-width: 4;
            stroke-linecap: round;
            fill: none;
        }
    </style>

    <div class="leetcode-grid">
        <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; overflow: visible;">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
                </marker>
            </defs>
            <line x1="35" y1="35" x2="35" y2="117" class="walk-line" />
            <path d="M 35 117 Q 120 117, 199 199" class="teleport-line" />
        </svg>

        <div class="cell start-node path-highlight"><span class="cell-cost">1</span><span class="cell-coord">(0,0)</span></div>
        <div class="cell"><span class="cell-cost">3</span><span class="cell-coord">(0,1)</span></div>
        <div class="cell"><span class="cell-cost">3</span><span class="cell-coord">(0,2)</span></div>
        
        <div class="cell path-highlight"><span class="cell-cost">2</span><span class="cell-coord">(1,0)</span></div>
        <div class="cell"><span class="cell-cost">5</span><span class="cell-coord">(1,1)</span></div>
        <div class="cell"><span class="cell-cost">4</span><span class="cell-coord">(1,2)</span></div>
        
        <div class="cell"><span class="cell-cost">4</span><span class="cell-coord">(2,0)</span></div>
        <div class="cell"><span class="cell-cost">3</span><span class="cell-coord">(2,1)</span></div>
        <div class="cell end-node path-highlight"><span class="cell-cost">5</span><span class="cell-coord">(2,2)</span></div>
    </div>
    
    <div style="margin-top: 25px; font-size: 13px; color: #4b5563; background: #f3f4f6; padding: 8px 16px; border-radius: 20px;">
        <span style="color: #10b981; font-weight: bold;">━━</span> Walk Path &nbsp;&nbsp; 
        <span style="color: #f59e0b; font-weight: bold;">- -</span> Teleportation Jump
    </div>
</div>

---



## The Multi-Universe Algorithm

To solve this problem efficiently, we break the logic into three distinct phases. The core idea is to treat the number of available teleportations as a "universe" index. Moving from universe $k$ to $k+1$ represents the act of using one teleportation jump.

1.  **Initial DP Calculation**: We compute the minimum cost path from every cell to the target $(m-1, n-1)$ assuming *no* teleportations are used.
2.  **Universe Transition**: We update the costs by projecting the possible jumps from Universe $k$ to Universe $k+1$.
3.  **Local Relaxation**: After a teleportation jump, we re-run a relaxation (or a simplified DP) to ensure that the new, potentially lower costs are propagated to neighboring cells in the new universe.

### 2.1 Simple DP Approach

In the first step, we ignore teleportations entirely. Since we want the cost from any cell $(i, j)$ to the target $(m-1, n-1)$, we use a bottom-up DP starting from the destination. 

In this specific implementation, we define `g[i][j]` as the cost to reach the target *after* having arrived at cell $(i, j)$.

```rust

// Compute optimal cost grid G[i][j] = min cost from (i,j) to (m-1,n-1)
let mut g = vec![vec![0; n]; m];

// Base case: destination has cost 0 (we are already there)
g[m - 1][n - 1] = 0;

// Fill last row (can only go right)
for j in (0..n - 1).rev() {
    g[m - 1][j] = grid[m - 1][j + 1] + g[m - 1][j + 1];
}

// Fill last column (can only go down)
for i in (0..m - 1).rev() {
    g[i][n - 1] = grid[i + 1][n - 1] + g[i + 1][n - 1];
}

// Fill rest of grid from bottom-right to top-left
for i in (0..m - 1).rev() {
    for j in (0..n - 1).rev() {
        g[i][j] = (grid[i + 1][j] + g[i + 1][j]).min(grid[i][j + 1] + g[i][j + 1]);
    }
}

// If no teleportations allowed, return cost from start (plus start cell cost)
if k == 0 {
    return grid[0][0] + g[0][0];
}
```

### Step 1 Visualization:
The Cost GridHere is the transition from the Input Grid to the DP Cost Matrix ($g$). The cost matrix represents the minimum distance to the target using only standard moves (Right and Down).

<div style="display: flex; flex-direction: column; align-items: center; gap: 40px; margin: 40px 0;"><div style="text-align: center;">
    <h4 style="margin-bottom: 15px; color: #666;">Original Grid (Costs)</h4>
    <div style="display: grid; grid-template-columns: repeat(3, 60px); gap: 10px;">
        <div class="cell" style="width:60px; height:60px; border:1px solid #ccc; display:flex; align-items:center; justify-content:center; background:#fff; font-weight:bold;">1</div>
        <div class="cell" style="width:60px; height:60px; border:1px solid #ccc; display:flex; align-items:center; justify-content:center; background:#fff; font-weight:bold;">3</div>
        <div class="cell" style="width:60px; height:60px; border:1px solid #ccc; display:flex; align-items:center; justify-content:center; background:#fff; font-weight:bold;">3</div>
        <div class="cell" style="width:60px; height:60px; border:1px solid #ccc; display:flex; align-items:center; justify-content:center; background:#fff; font-weight:bold;">2</div>
        <div class="cell" style="width:60px; height:60px; border:1px solid #ccc; display:flex; align-items:center; justify-content:center; background:#fff; font-weight:bold;">5</div>
        <div class="cell" style="width:60px; height:60px; border:1px solid #ccc; display:flex; align-items:center; justify-content:center; background:#fff; font-weight:bold;">4</div>
        <div class="cell" style="width:60px; height:60px; border:1px solid #ccc; display:flex; align-items:center; justify-content:center; background:#fff; font-weight:bold;">4</div>
        <div class="cell" style="width:60px; height:60px; border:1px solid #ccc; display:flex; align-items:center; justify-content:center; background:#fff; font-weight:bold;">3</div>
        <div class="cell" style="width:60px; height:60px; border:1px solid #ccc; display:flex; align-items:center; justify-content:center; background:#fff; font-weight:bold; color:#a855f7;">5</div>
    </div>
</div>

<div style="font-size: 30px; color: #ccc;">↓ DP Calculation ↓</div>

<div style="text-align: center;">
    <h4 style="margin-bottom: 15px; color: #10b981;">Computed DP Table ($g$)</h4>
    <div style="display: grid; grid-template-columns: repeat(3, 60px); gap: 10px;">
        <div class="cell" style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">14</div>
        <div class="cell" style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">12</div>
        <div class="cell" style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">9</div>
        <div class="cell" style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">12</div>
        <div class="cell" style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">8</div>
        <div class="cell" style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">5</div>
        <div class="cell" style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">8</div>
        <div class="cell" style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">5</div>
        <div class="cell" style="width:60px; height:60px; border:2px solid #a855f7; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#faf5ff; font-weight:bold;">0</div>
    </div>
    <p style="font-size: 12px; color: #888; margin-top: 10px;">Each cell represents min_cost(cell → (2,2))</p>
</div>
</div>


## The Multi-Universe Algorithm

To solve this problem efficiently, we break the logic into three distinct phases. The core idea is to treat the number of available teleportations as a "universe" index. Moving from universe $k$ to $k+1$ represents the act of using one teleportation jump.

1.  **Initial DP Calculation**: Compute the minimum cost path from every cell to the target $(m-1, n-1)$ assuming *no* teleportations.
2.  **Universe Transition**: Update the costs by projecting possible jumps from Universe $k$ to Universe $k+1$.
3.  **Local Relaxation**: Re-run a relaxation step to ensure new, lower costs are propagated to neighboring cells in the new universe.

---

### 2.1 Simple DP Approach

In the first step, we ignore teleportations. Since we want the cost from any cell $(i, j)$ to the target $(m-1, n-1)$, we use a bottom-up DP starting from the destination. In this implementation, `g[i][j]` is the cost to reach the target *after* having arrived at cell $(i, j)$.

```rust
// Compute optimal cost grid G[i][j] = min cost from (i,j) to (m-1,n-1)
let mut g = vec![vec![0; n]; m];

// Base case: destination has cost 0
g[m - 1][n - 1] = 0;

// Fill last row (can only go right)
for j in (0..n - 1).rev() {
    g[m - 1][j] = grid[m - 1][j + 1] + g[m - 1][j + 1];
}

// Fill last column (can only go down)
for i in (0..m - 1).rev() {
    g[i][n - 1] = grid[i + 1][n - 1] + g[i + 1][n - 1];
}

// Fill rest of grid from bottom-right to top-left
for i in (0..m - 1).rev() {
    for j in (0..n - 1).rev() {
        g[i][j] = (grid[i + 1][j] + g[i + 1][j]).min(grid[i][j + 1] + g[i][j + 1]);
    }
}

// If no teleportations allowed, return cost from start
if k == 0 {
    return grid[0][0] + g[0][0];
}
```

## Step 1 Visualization:
Initial DP StateThe resulting matrix $g$ represents the "Walking Distance" to the exit. For our example grid = [[1,3,3],[2,5,4],[4,3,5]], the DP table looks like this:

<div style="display: flex; flex-direction: column; align-items: center; gap: 20px; margin: 30px 0;"><div style="text-align: center;"><h4 style="margin-bottom: 10px; color: #10b981;">DP Table ($g$) - No Teleports</h4><div style="display: grid; grid-template-columns: repeat(3, 60px); gap: 10px;"><div style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">14</div><div style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">12</div><div style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">9</div><div style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">12</div><div style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">8</div><div style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">5</div><div style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">8</div><div style="width:60px; height:60px; border:2px solid #10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; font-weight:bold;">5</div><div style="width:60px; height:60px; border:2px solid #a855f7; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#faf5ff; font-weight:bold;">0</div></div></div></div>

## 2.2 Universe Transition:

(Teleportation Update)To update from Universe $k$ to $k+1$, we must find the best teleportation target. By sorting cells by Grid Value then by DP Value, we achieve a linear-time update.

```rust 
fn teleportation_update(grid: &Vec<Vec<i32>>, g: &mut Vec<Vec<i32>>) {
    let m = grid.len();
    let n = grid[0].len();

    let mut cells = Vec::new();
    for i in 0..m {
        for j in 0..n {
            cells.push((grid[i][j], g[i][j], i, j));
        }
    }
    
    // Sort primarily by grid value for valid jumps, 
    // and secondarily by DP value to find the best target.
    cells.sort_by_key(|&(val, g_val, _, _)| (val, g_val));

    let mut min_g_so_far = i32::MAX;
    for (grid_val, g_val, i, j) in cells {
        // Current cell teleports to the best cell encountered so far
        g[i][j] = g[i][j].min(min_g_so_far);
        min_g_so_far = min_g_so_far.min(g[i][j]);
    }
}
```

## Step 2 Visualization:
Universe TransitionAfter the teleportation update, the costs "collapse" as cells discover shortcuts. The matrix $g$ updates from the initial state to the "1-jump" state:

<div style="display: flex; flex-direction: column; align-items: center; gap: 30px; margin: 40px 0; background: #fffdfa; padding: 25px; border-radius: 15px; border: 1px dashed #f59e0b;"><div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap; justify-content: center;"><div style="text-align: center;"><span style="font-size: 11px; font-weight: bold; color: #666;">UNIVERSE 0</span><div style="display: grid; grid-template-columns: repeat(3, 50px); gap: 8px; margin-top: 10px;"><div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">14</div><div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">12</div><div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">9</div><div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">12</div><div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">8</div><div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">5</div><div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">8</div><div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">5</div><div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">0</div></div></div><div style="font-size: 30px; color: #f59e0b;">⚡</div><div style="text-align: center;"><span style="font-size: 11px; font-weight: bold; color: #3b82f6;">UNIVERSE 1</span><div style="display: grid; grid-template-columns: repeat(3, 50px); gap: 8px; margin-top: 10px;"><div style="width:50px; height:50px; border:2px solid #3b82f6; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#eff6ff; font-weight:bold;">14</div><div style="width:50px; height:50px; border:2px solid #3b82f6; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#eff6ff; font-weight:bold;">5</div><div style="width:50px; height:50px; border:2px solid #3b82f6; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#eff6ff; font-weight:bold;">5</div><div style="width:50px; height:50px; border:2px solid #3b82f6; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#eff6ff; font-weight:bold;">12</div><div style="width:50px; height:50px; border:2px solid #3b82f6; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#eff6ff; font-weight:bold;">0</div><div style="width:50px; height:50px; border:2px solid #3b82f6; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#eff6ff; font-weight:bold;">5</div><div style="width:50px; height:50px; border:2px solid #3b82f6; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#eff6ff; font-weight:bold;">5</div><div style="width:50px; height:50px; border:2px solid #3b82f6; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#eff6ff; font-weight:bold;">5</div><div style="width:50px; height:50px; border:2px solid #a855f7; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#faf5ff; font-weight:bold;">0</div></div></div></div></div>


### 2.3 Local Relaxation

After teleporting, we treat the new values in  as updated "exit points." We then perform a relaxation pass to ensure that the adjacent cells are aware of these new potential paths.

```rust
fn relaxation_update(grid: &Vec<Vec<i32>>, g: &mut Vec<Vec<i32>>) {
    let m = grid.len();
    let n = grid[0].len();

    // Relax from bottom-right to top-left
    for i in (0..m).rev() {
        for j in (0..n).rev() {
            if i == m - 1 && j == n - 1 {
                continue; // destination remains the base case 0
            }

            let mut min_cost = g[i][j];

            // Check if walking Down provides a better cost
            if i + 1 < m {
                min_cost = min_cost.min(grid[i + 1][j] + g[i + 1][j]);
            }

            // Check if walking Right provides a better cost
            if j + 1 < n {
                min_cost = min_cost.min(grid[i][j + 1] + g[i][j + 1]);
            }

            g[i][j] = min_cost;
        }
    }
}
```

#### Step 3 Visualization: Final Relaxation

This animation shows the values "settling" into their final state for Universe 1. Notice how the teleportation at  propagates its value of  to the cells above it.

<div style="display: flex; flex-direction: column; align-items: center; gap: 30px; margin: 40px 0; background: #f0fff4; padding: 25px; border-radius: 15px; border: 1px solid #68d391;">
<div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap; justify-content: center;">
<div style="text-align: center;">
<span style="font-size: 11px; font-weight: bold; color: #3b82f6;">PRE-RELAXED</span>
<div style="display: grid; grid-template-columns: repeat(3, 50px); gap: 8px; margin-top: 10px;">
<div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">14</div>
<div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">5</div>
<div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">5</div>
<div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">12</div>
<div style="width:50px; height:50px; border:1px solid #3b82f6; display:flex; align-items:center; justify-content:center; background:#eff6ff;">0</div>
<div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">5</div>
<div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">5</div>
<div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">5</div>
<div style="width:50px; height:50px; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; background:#fff;">0</div>
</div>
</div>
<div style="font-size: 30px; color: #48bb78;">➔</div>
<div style="text-align: center;">
<span style="font-size: 11px; font-weight: bold; color: #2f855a;">FINAL UNIVERSE 1</span>
<div style="display: grid; grid-template-columns: repeat(3, 50px); gap: 8px; margin-top: 10px;">
<div style="width:50px; height:50px; border:2px solid #48bb78; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#f0fff4; font-weight:bold; color:#22543d;">7</div>
<div style="width:50px; height:50px; border:2px solid #48bb78; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#f0fff4; font-weight:bold; color:#22543d;">5</div>
<div style="width:50px; height:50px; border:2px solid #48bb78; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#f0fff4; font-weight:bold; color:#22543d;">5</div>
<div style="width:50px; height:50px; border:2px solid #48bb78; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#f0fff4; font-weight:bold; color:#22543d;">7</div>
<div style="width:50px; height:50px; border:2px solid #48bb78; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#f0fff4; font-weight:bold; color:#22543d;">0</div>
<div style="width:50px; height:50px; border:2px solid #48bb78; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#f0fff4; font-weight:bold; color:#22543d;">5</div>
<div style="width:50px; height:50px; border:2px solid #48bb78; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#f0fff4; font-weight:bold; color:#22543d;">5</div>
<div style="width:50px; height:50px; border:2px solid #48bb78; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#f0fff4; font-weight:bold; color:#22543d;">5</div>
<div style="width:50px; height:50px; border:2px solid #a855f7; border-radius:6px; display:flex; align-items:center; justify-content:center; background:#faf5ff; font-weight:bold;">0</div>
</div>
</div>
</div>
</div>

---

By repeating Step 2 and Step 3 exactly  times, we effectively explore all possible paths that use up to  teleportations. The final answer will be found at `grid[0][0] + g[0][0]`.


To wrap up your Distill post, here is the final content including the Complexity Analysis, a Conclusion, and a Manim script you can use to generate a professional-grade animation for your blog.

### 3. Complexity Analysis

The efficiency of this "Multi-Universe" approach lies in how it avoids the overhead of a full graph search by leveraging the grid's structure and sorting.

* **Time Complexity**:
* **Initial DP**:  to fill the grid once.
* **Universe Transitions**: For each of the  teleportations, we perform a sort taking  and a linear sweep of .
* **Relaxation**: Each relaxation pass takes .
* **Total**: . Given  is usually small, this is significantly faster than a general Dijkstra on a dense graph of teleports.


* **Space Complexity**:  if we overwrite the grid  in each universe, or  if we choose to store every state for visualization.

---

### 4. Algorithm Visualization ()


<div class="video-container" style="text-align: center; margin: 40px 0;">
  <video 
    width="100%" 
    style="max-width: 800px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);" 
    controls 
    autoplay 
    loop 
    muted 
    playsinline>
    <source src="{{ 'assets/img/GridEvolution.mp4' | relative_url }}" type="video/mp4">
    Your browser does not support the video tag.
  </video>
  <p style="font-size: 0.9em; color: #666; margin-top: 10px; font-style: italic;">
    Visualization of the Universe Shift: Watch the costs collapse as k increases from 0 to 2.
  </p>
</div>

### 5. Conclusion

This problem was an incredible exercise in **3D Dynamic Programming** and state-space reduction. While the problem initially presents as a shortest-path challenge on a graph, viewing it through the lens of "Universe Transitions" allows us to optimize the teleportation logic using a simple sorting trick.

By separating the **walking logic** (DP) from the **jumping logic** (Sorting/Sweep), we turned a potentially exponential search into a clean, iterative process. It's a perfect example of how re-indexing our state can simplify complex interactions.

---

