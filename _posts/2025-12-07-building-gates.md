---
layout: post
title: Counting Closed Regions in a Path Using Euler's Formula
tags: distill competitive usaco graph-theory
giscus_comments: true
date: 2025-12-07
featured: true
mermaid:
  enabled: true
  zoomable: true
code_diff: true
map: true
chart:
  chartjs: true
  echarts: true
  vega_lite: true
tikzjax: true
typograms: true
authors:
  - name: A.Belcaid
    affiliations:
      name: ENSA, Tetouan
---

## The Problem

Imagine you're given a sequence of directions (N, S, E, W) that describe a path on a 2D grid starting from the origin (0, 0). As you follow this path, you might cross your own trail, creating closed regions or "loops" in the plane.

**Question**: How many closed regions does your path create?

This seemingly simple question leads us to a beautiful application of graph theory and one of the most elegant formulas in discrete mathematics: **Euler's Formula for Planar Graphs**.

## A Concrete Example

Let's trace through the path: `NNNESWWWSSEEEE`

Starting from (0,0), we move:
- NNN: up 3 steps → (0,3)
- E: right → (1,3)
- S: down → (1,2)
- WWW: left 3 steps → (-2,2)
- SS: down 2 steps → (-2,0)
- EEEE: right 4 steps → (2,0)

```mermaid
graph LR
    A["(0,0)"] --> B["(0,1)"]
    B --> C["(0,2)"]
    C --> D["(0,3)"]
    D --> E["(1,3)"]
    E --> F["(1,2)"]
    F --> G["(0,2)"]
    G --> H["(-1,2)"]
    H --> I["(-2,2)"]
    I --> J["(-2,1)"]
    J --> K["(-2,0)"]
    K --> L["(-1,0)"]
    L --> M["(0,0)"]
    M --> N["(1,0)"]
    N --> O["(2,0)"]
```

If we visualize this path carefully, we can see it creates **2 closed regions**!

## The Naive Approach: Cycle Detection

My first instinct was to model this as a graph problem:
1. Create a node for each unique coordinate visited
2. Add edges between consecutive points in the path
3. Run DFS to detect cycles

Here's what that looks like:

```cpp
void dfsVisit(int u, const vector<vector<int>>& graph, 
              vector<int>& color, vector<int>& parent, 
              int& cycleCount) {
    color[u] = 1; // Gray - visiting
    
    for (int v : graph[u]) {
        if (color[v] == 0) { // Unvisited
            parent[v] = u;
            dfsVisit(v, graph, color, parent, cycleCount);
        } 
        else if (color[v] == 1 && parent[u] != v) {
            // Back edge found!
            cycleCount++;
        }
    }
    
    color[u] = 2; // Black - done
}
```

**Problem**: This approach is tricky! How do you avoid double-counting? How do you handle overlapping cycles? The relationship between back edges and actual closed regions isn't straightforward.

## The Elegant Solution: Euler's Formula

Then comes the insight: the graph we're building is **planar** (can be drawn on a plane without edge crossings). For such graphs, there's a beautiful relationship:

\[
V - E + F = 2
\]

Where:
- $V$ = number of vertices (unique points)
- $E$ = number of edges (unique connections)
- $F$ = number of faces (including the outer infinite face)

Since we want only the **bounded faces** (closed regions), we subtract 1:

$$\text{Closed Regions} = F - 1 = E - V + 1$$

That's it! Count vertices, count edges, apply the formula.

## The Implementation

```cpp
#include <bits/stdc++.h>
using namespace std;

typedef pair<int, int> pii;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int N;
    cin >> N;
    string path;
    cin >> path;
    
    map<pii, int> points_index;
    points_index[{0, 0}] = 0;
    pii current = {0, 0};
    
    // Track unique edges
    set<pair<int,int>> edges;
    
    for (char step : path) {
        int i = points_index[current];
        
        // Move based on direction
        if (step == 'N') current.second++;
        else if (step == 'S') current.second--;
        else if (step == 'E') current.first++;
        else if (step == 'W') current.first--;
        
        // Add new point if needed
        if (!points_index.count(current)) {
            points_index[current] = points_index.size();
        }
        
        int j = points_index[current];
        
        // Add edge (normalized to avoid duplicates)
        edges.insert({min(i,j), max(i,j)});
    }
    
    int V = points_index.size();
    int E = edges.size();
    
    // Euler's formula: V - E + F = 2
    // Closed regions = F - 1 = E - V + 1
    int closed_regions = E - V + 1;
    
    cout << closed_regions << endl;
    
    return 0;
}
```

**Time Complexity**: $O(N \log V)$ where $N$ is the path length and $V$ is the number of unique vertices.

**Space Complexity**: $O(V + E)$

## Why This Works

The key insight is that our path creates a **connected planar graph**:

1. **Planar**: No edges cross (they meet only at vertices)
2. **Connected**: You can reach any visited point from any other
3. **Each edge traversed counts once**: We use a set to track unique edges

Euler's formula holds for any connected planar graph, making it perfect for this problem!

## Interactive Visualization

Try it yourself! Enter a path string (using N, S, E, W) and see the closed regions:

<div id="path-visualizer"></div>

<script>
function visualizePath() {
    const container = document.getElementById('path-visualizer');
    container.innerHTML = `
        <div style="font-family: sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; border: 2px solid #333; border-radius: 8px;">
            <h3 style="margin-top: 0;">Path Visualizer</h3>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Enter Path (N/S/E/W):</label>
                <input type="text" id="pathInput" placeholder="e.g., NNNESWWWSSEEEE" 
                       style="width: 100%; padding: 8px; font-size: 16px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <button onclick="drawPath()" style="padding: 10px 20px; font-size: 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Visualize
            </button>
            <div id="result" style="margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 4px; display: none;">
                <strong>Results:</strong><br>
                Vertices (V): <span id="vertices">0</span><br>
                Edges (E): <span id="edges">0</span><br>
                <span style="font-size: 18px; color: #2196F3;">Closed Regions: <span id="regions">0</span></span>
            </div>
            <canvas id="canvas" width="600" height="600" 
                    style="border: 1px solid #ddd; margin-top: 15px; display: none; max-width: 100%;"></canvas>
        </div>
    `;
}

function drawPath() {
    const pathInput = document.getElementById('pathInput').value.toUpperCase();
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const result = document.getElementById('result');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!pathInput || !/^[NSEW]+$/.test(pathInput)) {
        alert('Please enter a valid path using only N, S, E, W');
        return;
    }
    
    // Parse path
    const points = [[0, 0]];
    let current = [0, 0];
    
    for (let step of pathInput) {
        if (step === 'N') current = [current[0], current[1] + 1];
        else if (step === 'S') current = [current[0], current[1] - 1];
        else if (step === 'E') current = [current[0] + 1, current[1]];
        else if (step === 'W') current = [current[0] - 1, current[1]];
        points.push([...current]);
    }
    
    // Calculate unique vertices and edges
    const pointSet = new Set();
    const edgeSet = new Set();
    const pointToIndex = new Map();
    
    pointSet.add('0,0');
    pointToIndex.set('0,0', 0);
    
    for (let i = 1; i < points.length; i++) {
        const key = `${points[i][0]},${points[i][1]}`;
        if (!pointSet.has(key)) {
            pointToIndex.set(key, pointSet.size);
            pointSet.add(key);
        }
        
        const prevKey = `${points[i-1][0]},${points[i-1][1]}`;
        const idx1 = pointToIndex.get(prevKey);
        const idx2 = pointToIndex.get(key);
        const edgeKey = idx1 < idx2 ? `${idx1}-${idx2}` : `${idx2}-${idx1}`;
        edgeSet.add(edgeKey);
    }
    
    const V = pointSet.size;
    const E = edgeSet.size;
    const closedRegions = Math.max(0, E - V + 1);
    
    // Update results
    document.getElementById('vertices').textContent = V;
    document.getElementById('edges').textContent = E;
    document.getElementById('regions').textContent = closedRegions;
    result.style.display = 'block';
    canvas.style.display = 'block';
    
    // Find bounds
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    points.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    });
    
    // Scale and offset
    const padding = 40;
    const scaleX = (canvas.width - 2 * padding) / Math.max(1, maxX - minX);
    const scaleY = (canvas.height - 2 * padding) / Math.max(1, maxY - minY);
    const scale = Math.min(scaleX, scaleY, 30);
    
    const offsetX = canvas.width / 2 - ((maxX + minX) / 2) * scale;
    const offsetY = canvas.height / 2 + ((maxY + minY) / 2) * scale;
    
    function toCanvas(x, y) {
        return [offsetX + x * scale, offsetY - y * scale];
    }
    
    // Draw path
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const [startX, startY] = toCanvas(points[0][0], points[0][1]);
    ctx.moveTo(startX, startY);
    
    for (let i = 1; i < points.length; i++) {
        const [x, y] = toCanvas(points[i][0], points[i][1]);
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw vertices
    pointSet.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        const [cx, cy] = toCanvas(x, y);
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Draw start point
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(startX, startY, 6, 0, 2 * Math.PI);
    ctx.fill();
}

visualizePath();
</script>

## Key Takeaways

1. **Graph modeling is powerful**: Converting the path to a graph opens up many algorithmic tools
2. **Euler's formula is elegant**: A simple formula replaces complex cycle detection
3. **Problem structure matters**: Recognizing planarity was the key insight
4. **Unique edges matter**: Using a set to track edges prevents double-counting

## Further Reading

- [Euler's Formula on Wikipedia](https://en.wikipedia.org/wiki/Planar_graph)
- [Planar Graphs in Discrete Mathematics](https://discrete.openmathbooks.org/more/mdm/sec_planar.html)
- [Graph Theory Fundamentals](https://math.libretexts.org/Bookshelves/Combinatorics_and_Discrete_Mathematics/Combinatorics_(Morris)/03:_Graph_Theory)

---

*Have you encountered other problems where Euler's formula provides an elegant solution? Share in the comments below!*
