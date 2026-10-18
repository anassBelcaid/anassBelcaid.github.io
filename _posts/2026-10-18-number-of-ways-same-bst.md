---
layout: post
title: "Different Orders, Same Tree: Reordering a BST"
tags: competitive leetcode binary-search-tree combinatorics
giscus_comments: true
date: 2026-10-18
featured: true
math: true
authors:
  - name: A.Belcaid
    affiliations:
      name: ENSA, Tetouan
---

For this daily problem, let's start by watching the tree grow. Before counting anything, I want to make the question concrete: **how much can we change the insertion order without changing the tree?**

This post begins my walkthrough of [LeetCode 1569 — Number of Ways to Reorder Array to Get Same BST](https://leetcode.com/problems/number-of-ways-to-reorder-array-to-get-same-bst/). I start with the examples, then retrace the ideas I tried before the counting argument finally clicked.

## 1. What are we counting?

We are given an array `nums`, a permutation of the integers from `1` to `n`. Insert its values, from left to right, into an initially empty **binary search tree (BST)**:

- The first value becomes the root.
- For each remaining value, start at the root: go **left if smaller**, **right if larger**.
- Keep comparing until an empty child position is reached, then insert the value there.

Count the **other permutations** that produce exactly the same tree: the same root, the same values, and the same left and right child relationships. The original order is excluded. Return the count modulo $$10^9 + 7$$; the input can contain up to `1000` values.

Having the same sorted values is not enough. Every permutation here has those! It is the placement of those values in the tree that must stay the same.

### A small example: two orders, one tree

With `nums = [2,1,3]`, both insertion orders below work. Whether `1` or `3` arrives second, it finds its own side of the root.

<div class="bst-small-examples">
  <figure><figcaption><code>[2,1,3]</code> · original</figcaption><svg viewBox="0 0 240 160" role="img" aria-label="Root 2 with left child 1 and right child 3"><path d="M120 35L65 115M120 35L175 115"/><circle cx="120" cy="35" r="22"/><circle cx="65" cy="115" r="22"/><circle cx="175" cy="115" r="22"/><text x="120" y="35">2</text><text x="65" y="115">1</text><text x="175" y="115">3</text></svg></figure>
  <figure><figcaption><code>[2,3,1]</code> · counted ✓</figcaption><svg viewBox="0 0 240 160" role="img" aria-label="The same root 2 with left child 1 and right child 3"><path d="M120 35L65 115M120 35L175 115"/><circle cx="120" cy="35" r="22"/><circle cx="65" cy="115" r="22"/><circle cx="175" cy="115" r="22"/><text x="120" y="35">2</text><text x="65" y="115">1</text><text x="175" y="115">3</text></svg></figure>
</div>

There are two valid orders in total, but only **one alternative**, so the answer is **1**.

## 2. Five different journeys to the same BST

Now take `nums = [3,4,5,1,2]`. The root is `3`. On its left, `1` has a right child `2`; on its right, `4` has a right child `5`.

The original order and the five alternatives are shown below. Press **Play all** to watch the constructions together. Each beat either compares the incoming value with an existing node or inserts it into an empty position. The moving gold ring follows that value's search path; the faint outlines show the target tree.

<link rel="stylesheet" href="{{ '/assets/css/bst-reorder.css' | relative_url }}">
<div class="bst-lab" id="bst-reorder-lab">
  <div class="bst-lab-heading"><span>INSERTION LAB</span><strong>Six orders. One destination.</strong><p>Original + 5 alternatives · compare each decision side by side</p></div>
  <div class="bst-controls" hidden>
    <button type="button" data-action="play">Play all</button>
    <button type="button" data-action="step">Next beat</button>
    <button type="button" data-action="reset">Reset</button>
    <label>Speed <select aria-label="Animation speed"><option value="1400">Slow</option><option value="850" selected>Normal</option><option value="400">Fast</option></select></label>
  </div>
  <p class="bst-progress" role="status" aria-live="polite">The five alternatives are listed below. Enable JavaScript to animate their construction.</p>
  <div class="bst-cards"></div>
  <noscript><p>The target tree has edges 3 → 1 (left), 1 → 2 (right), 3 → 4 (right), and 4 → 5 (right).</p></noscript>
  <div class="bst-legend"><span>● Violet: root</span><span>● Teal: left subtree</span><span>● Blue: right subtree</span><span>◎ Gold: incoming value</span></div>
</div>
<script src="{{ '/assets/js/bst-reorder.js' | relative_url }}" defer></script>

The **five counted reorderings** are:

1. `[3,1,2,4,5]`
2. `[3,1,4,2,5]`
3. `[3,1,4,5,2]`
4. `[3,4,1,2,5]`
5. `[3,4,1,5,2]`

Together with `[3,4,5,1,2]`, that makes **six valid insertion orders**. Remove the original, and the answer is **5**.

Notice what changes and what stays fixed: values from opposite sides can take turns arriving, but in this example `1` must arrive before `2`, and `4` before `5`. Try following the teal nodes across all six panels, then the blue nodes. Their local order stays the same even when the two sides are interleaved.

### When there is no alternative

For `nums = [1,2,3]`, each new value goes right, producing a chain.

<div class="bst-small-examples bst-chain"><figure><figcaption><code>[1,2,3]</code> · answer: 0</figcaption><svg viewBox="0 0 300 220" role="img" aria-label="A right leaning chain: root 1, right child 2, and its right child 3"><path d="M75 35L150 105L225 175"/><circle cx="75" cy="35" r="22"/><circle cx="150" cy="105" r="22"/><circle cx="225" cy="175" r="22"/><text x="75" y="35">1</text><text x="150" y="105">2</text><text x="225" y="175">3</text></svg></figure></div>

The root forces `1` to come first. Inserting `3` before `2` would make `3` the right child of `1`, with `2` below it on the left—a different tree. Only the original order works, so the answer is **0**.

The question for the next section is now precise: **how can we count all valid insertion orders without trying every permutation?**

## 3. My first idea was close—but incomplete

I struggled with this one at first. Looking at the array, I could see two things that were already decided:

1. **The first value is the root.** Any order producing the same tree must start there.
2. **Every other value already belongs to one side.** Smaller values belong to the left subtree; larger values belong to the right subtree.

For our example, the root is `3`, the left subsequence is `[1,2]`, and the right subsequence is `[4,5]`. Splitting by value preserves the order in which values arrive on each side.

<div class="bst-lab bst-story" data-story="partition">
  <div class="bst-lab-heading"><span>FIRST OBSERVATION</span><strong>The root fixes the two groups.</strong><p>Follow each value from the input into its subtree's subsequence.</p></div>
  <div class="bst-story-stage"></div>
  <p class="bst-story-status" role="status" aria-live="polite">3 is the root; 1 and 2 go left; 4 and 5 go right.</p>
</div>

So I wrote down a tempting recurrence. Let $$f(T)$$ count all insertion orders that build tree $$T$$, **including the original order**. My first attempt was

$$
f(T) \stackrel{?}{=} f(L)\,f(R).
$$

Choose a valid order for the left subtree, choose one for the right, and multiply. It felt natural. But I had quietly treated each subtree as a **compact block** in the array: root, then all of one side, then all of the other.

The product alone does not say how to merge those two orders. If I concatenate left then right, I get `[3,1,2,4,5]`. Even allowing both block orders gives only that order and `[3,4,5,1,2]`. The four mixed orders are still missing. **The problem never required a subtree's values to occupy consecutive positions.**

<div class="bst-lab bst-story" data-story="blocks">
  <div class="bst-lab-heading"><span>FALSE START 01</span><strong>Subtrees are subsequences, not blocks.</strong><p>Watch the same two ordered groups occupy all six possible arrangements.</p></div>
  <div class="bst-story-stage"></div>
  <p class="bst-story-status" role="status" aria-live="polite">Two compact arrangements miss four valid interleavings.</p>
</div>

## 4. Could I count by depth instead?

I put the recurrence aside and tried another idea: group the nodes by depth. Nodes on the same level can exchange places without affecting the tree, provided all earlier levels have already been inserted. Perhaps I could multiply the factorials of the level sizes:

$$
\prod_d \bigl(\text{number of nodes at depth } d\bigr)!.
$$

That does count valid orders—but only the ones that finish each level before starting the next. Again, I had introduced a restriction that the problem did not have.

Consider a tree with root `4`, children `2` and `6`, and leaves `1,3,5,7`. In the valid order `[4,2,1,3,6,5,7]`, the node `1` arrives on **level 3 before `6` arrives on level 2**. Here I am numbering the root as level 1 (equivalently, depth 0).

<div class="bst-lab bst-story" data-story="depth">
  <div class="bst-lab-heading"><span>FALSE START 02</span><strong>A deeper node can arrive first.</strong><p>Build [4,2,1,3,6,5,7]. Watch level 3 appear while level 2 is still incomplete.</p></div>
  <div class="bst-story-stage"></div>
  <p class="bst-story-status" role="status" aria-live="polite">A node needs its ancestors first, not every node on an earlier level.</p>
</div>

For this tree, counting only level-by-level orders gives $$1!\cdot2!\cdot4!=48$$. That is only part of the answer; we will see below that there are actually **80** valid orders, including the original.

The real constraint is about **ancestors**, not global depth: every node must appear after its ancestors. Once `4` and `2` are present, `1` is free to arrive. It does not need to wait for `6`, which is in another branch.

My next attempt was to compare the values on the left and right and work out the ordering constraints directly. I found that too complicated to manage. The constraints were there, but I was not finding a clean way to count the orders satisfying them.

## 5. The hint that made it click

At that point, I read the hints. The first was the kind of broad nudge I often see: use recursion. It did not finish the argument for me, but it encouraged me to return to the first idea. The split into a root and two subtrees was useful after all.

The second hint was the one that helped: **how many ways can we choose positions for $$x$$ elements among $$x+y$$ positions?**

That clicked immediately. After choosing a valid order for each subtree, I still have to place those orders into the remaining array positions.

Suppose the left subtree has $$x$$ nodes and the right subtree has $$y$$ nodes. Fix one valid left order and one valid right order. After the root, there are $$x+y$$ empty slots:

- Choose **which $$x$$ slots belong to the left**.
- Fill those slots with the chosen left order, from left to right.
- The remaining $$y$$ slots belong to the right; fill them with the chosen right order, also from left to right.

There is no second choice of right slots: the left slots already determine them. And there is no extra permutation inside either group at this stage—we have already chosen those two orders.

<div class="bst-lab" id="bst-slot-lab">
  <div class="bst-lab-heading"><span>THE MISSING FACTOR</span><strong>Choose the slots. The merge follows.</strong><p>Click a slot to switch it between left and right. Choose exactly two left slots, or cycle through all six valid choices.</p></div>
  <div class="bst-controls" hidden><button type="button" data-slot="play">Play choices</button><button type="button" data-slot="next">Next choice</button><button type="button" data-slot="reset">Reset</button></div>
  <p>Fixed orders: <strong class="bst-left-text">left [1,2]</strong> · <strong class="bst-right-text">right [4,5]</strong> · root 3 stays first</p>
  <div class="bst-slot-buttons"></div>
  <div class="bst-merge-stage"></div>
  <p class="bst-slot-status" role="status" aria-live="polite">Choose 2 of 4 positions: C(4,2) = 6. Each choice gives one merge.</p>
</div>

For example, choosing slots 1 and 3 for the left gives the pattern `L R L R`, hence `[3,1,4,2,5]`. Choosing slots 2 and 4 gives `R L R L`, hence `[3,4,1,5,2]`.

The number of choices is the binomial coefficient

$$
\binom{x+y}{x} = \frac{(x+y)!}{x!\,y!}.
$$

We could equally choose the right slots: $$\binom{x+y}{y}$$ gives the same count. Independence here means we can interleave the two **fixed valid sequences** freely, while preserving the internal order of each one.

## 6. The three factors finally fit together

My original recurrence had two of the three ingredients. Now each factor has a job:

1. $$f(L)$$: choose a valid left-subtree order.
2. $$f(R)$$: choose a valid right-subtree order.
3. $$\binom{x+y}{x}$$: choose the slots that interleave those orders.

The complete count is

$$
\boxed{f(T)=f(L)\,
f(R)\,
\binom{x+y}{x}.}
$$

An empty tree has one insertion order—the empty sequence—so $$f(\varnothing)=1$$. A single-node tree also has one order. This makes the recurrence work even when one side is empty: there is only one way to choose all (or none) of the available slots.

In our five-node example, each side is a two-node chain, so each has only one valid order:

$$
f(T)=1\cdot1\cdot\binom{4}{2}=6.
$$

For the seven-node tree from the depth experiment, there are two left orders (`[2,1,3]` and `[2,3,1]`), two right orders (`[6,5,7]` and `[6,7,5]`), and $$\binom{6}{3}=20$$ ways to interleave each pair:

$$
f(T)=2\cdot2\cdot20=80.
$$

<div class="bst-lab" id="bst-factor-lab">
  <div class="bst-lab-heading"><span>THREE INDEPENDENT CHOICES</span><strong>2 × 2 × 20 = 80 orders.</strong><p>Change either subtree order or the slot pattern. The root stays 4 and every resulting array builds the same seven-node tree.</p></div>
  <div class="bst-controls" hidden><button type="button" data-factor="left">Switch left order</button><button type="button" data-factor="right">Switch right order</button><button type="button" data-factor="mask">Next slot pattern</button></div>
  <div class="bst-factor-readout"></div>
  <div class="bst-factor-stage"></div>
  <p class="bst-factor-status" role="status" aria-live="polite">2 left orders × 2 right orders × 20 slot patterns = 80 valid insertion orders.</p>
</div>

### Why this counts every order exactly once

Take any valid insertion order and remove its first value, the root. Read only the values smaller than the root: they form a valid order for the left subtree. Read only the larger values: they form a valid order for the right subtree. Their positions give a unique left/right slot pattern.

Conversely, start with any valid left order, any valid right order, and any such pattern. After comparison with the root, values go to their own subtree, where they encounter exactly the same earlier values from that side. Interleaving the other side cannot change those insertions. The same tree is therefore rebuilt.

So every valid array corresponds to exactly one triple: **left order, right order, slot pattern**. Nothing is missed, and nothing is counted twice.

That was the missing piece for me. The recursion was right; my first count had left out the ways the two subtrees can take turns.

Finally, $$f$$ includes the original order. The problem's answer is therefore

$$
\bigl(f(T)-1\bigr)\bmod (10^9+7).
$$

We subtract **once, at the end**, not inside the subtree counts. Next comes the implementation: turning this recurrence into a computation.

<script src="{{ '/assets/js/bst-reorder-story.js' | relative_url }}" defer></script>

## 7. Computing the binomial coefficient modulo a prime

The recurrence is short. The arithmetic behind $$\binom{n}{k}$$ needs a little more care. Here, `n` is the number of available positions in a call to `choose`; for a subtree with `n` nodes, we will call it with `n - 1` positions because the root is fixed.

In ordinary arithmetic,

$$
\binom{n}{k}=\frac{n!}{k!(n-k)!}.
$$

But I cannot compute factorials modulo $$p=10^9+7$$ and then use ordinary integer division on the residues. Division does not survive reduction that way. Instead, I multiply by **modular inverses**.

For a nonzero residue $$a$$ modulo a prime $$p$$, Fermat's little theorem gives

$$
\begin{gathered}
a^{p-1}\equiv1\pmod p, \\
a^{-1}\equiv a^{p-2}\pmod p.
\end{gathered}
$$

All factorials we need stop at `1000`, well below $$p$$. None contains a factor of $$p$$, so all of them have inverses. The formula becomes

$$
\binom{n}{k}\equiv
n!\,(k!)^{-1}\,((n-k)!)^{-1}\pmod p.
$$

### Build two tables, then answer each query in constant time

I store `fact[i]`, the residue of $$i!$$, and `inv_fact[i]`, the residue of $$(i!)^{-1}$$. The factorial table is a forward pass:

$$
\begin{gathered}
\text{fact}[0]=1, \\
\text{fact}[i]=i\,\text{fact}[i-1]\bmod p.
\end{gathered}
$$

For the inverse table, I only need **one exponentiation**, at the largest index $$B$$:

$$
\text{inv\_fact}[B]=\text{fact}[B]^{p-2}\bmod p.
$$

Then I walk backward. Since $$i!=i\,(i-1)!$$, multiplying the inverse of $$i!$$ by $$i$$ gives the inverse of $$(i-1)!$$:

$$
\text{inv\_fact}[i-1]
=i\,\text{inv\_fact}[i]\bmod p.
$$

For a tiny example using modulus `7`, `4!` has residue `3`, whose inverse is `5` because $$3\cdot5\equiv1\pmod7$$. The backward pass gives the inverse of `3!` as $$4\cdot5\bmod7=6$$, then the inverse of `2!` as $$3\cdot6\bmod7=4$$. Thus $$\binom{4}{2}\bmod7=3\cdot4\cdot4\bmod7=6$$.

The `mod_pow` helper uses **binary exponentiation**: if the exponent's current bit is set, multiply the result by the current base; square the base and shift the exponent right. This takes $$O(\log p)$$ multiplications instead of looping $$p-2$$ times.

Here is the arithmetic part of my implementation. I have removed the unused collection imports; only `HashMap` is needed.

```rust
use std::collections::HashMap;

const MOD: u64 = 10u64.pow(9) + 7;

fn mod_pow(mut a: u64, mut e: u64, modulus: u64) -> u64 {
    let mut result = 1;
    while e > 0 {
        if e & 1 == 1 {
            result = (result as u128 * a as u128 % modulus as u128) as u64;
        }
        a = (a as u128 * a as u128 % modulus as u128) as u64;
        e >>= 1;
    }
    result
}

fn factorial_tables(n: usize, modulus: u64) -> (Vec<u64>, Vec<u64>) {
    let mut fact = vec![1; n + 1];
    let mut inv_fact = vec![1; n + 1];
    for i in 1..=n {
        fact[i] = (fact[i - 1] as u128 * i as u128 % modulus as u128) as u64;
    }

    // Requires a prime modulus greater than n.
    inv_fact[n] = mod_pow(fact[n], modulus - 2, modulus);
    for i in (1..=n).rev() {
        inv_fact[i - 1] = (inv_fact[i] as u128 * i as u128 % modulus as u128) as u64;
    }
    (fact, inv_fact)
}

/// Computes C(n, k) modulo a prime greater than n, for n <= 1000.
fn choose(n: usize, k: usize, modulus: u64) -> u64 {
    assert!(n <= 1000);
    assert!(modulus > n as u64 && modulus >= 2);
    if k > n {
        return 0;
    }

    // Reuse tables across calls with the same modulus on this thread.
    thread_local! {
        static TABLES: std::cell::RefCell<HashMap<u64, (Vec<u64>, Vec<u64>)>> =
            std::cell::RefCell::new(HashMap::new());
    }
    TABLES.with(|tables| {
        let mut tables = tables.borrow_mut();
        let (fact, inv_fact) = tables
            .entry(modulus)
            .or_insert_with(|| factorial_tables(1000.min((modulus - 1) as usize), modulus));
        let result = fact[n] as u128 * inv_fact[k] as u128 % modulus as u128;
        (result * inv_fact[n - k] as u128 % modulus as u128) as u64
    })
}
```

The first query for a given modulus builds the tables. Later queries reuse them through a thread-local cache. `HashMap` associates each modulus with its own tables; `RefCell` lets the closure initialize that cache when needed. For this problem, only the entry for `MOD` is used. With $$B=1000$$, preprocessing costs $$O(B+\log p)$$ time and $$O(B)$$ space. Afterward, each binomial evaluation needs three table reads and two modular multiplications, plus the cache lookup.

The assertions check the size bounds, **not primality**; a prime modulus remains a requirement of this helper. The casts to `u128` let the helper multiply two `u64` values before reducing without overflowing the intermediate product.

## 8. Translating the recurrence into Rust

The recursive part follows the argument directly. I do not need to allocate a tree: an insertion sequence already tells me its root and lets me recover the two subtree sequences.

```rust
struct Solution;

impl Solution {
    pub fn num_of_ways(nums: Vec<i32>) -> i32 {
        // Exclude the original order once, after counting the whole tree.
        ((Self::num_ways(nums) + MOD - 1) % MOD) as i32
    }

    pub fn num_ways(nums: Vec<i32>) -> u64 {
        // Count every order for this subtree, including its original order.
        let n = nums.len();
        if n <= 2 {
            return 1;
        }

        let root = nums[0];
        let mut left = Vec::new();
        let mut right = Vec::new();
        for &value in &nums[1..] {
            if value < root {
                left.push(value);
            } else {
                right.push(value);
            }
        }

        let k = left.len();
        let interleavings = choose(n - 1, k, MOD);
        let left_ways = Self::num_ways(left);
        let right_ways = Self::num_ways(right);

        interleavings * left_ways % MOD * right_ways % MOD
    }
}
```

The two code blocks together form the solution. On LeetCode, `Solution` is supplied by the platform; the standalone declaration above is useful when compiling locally.

### Reading the code as the three-factor formula

For zero, one, or two nodes, there is exactly one order that produces that particular BST. With two nodes, reversing the values changes the root. This explains the `n <= 2` base case, including the empty subtree.

For larger inputs, the partition loop scans left to right and appends each value to its side. It preserves the relative order in both subsequences, so the recursive calls describe the same left and right subtrees as the input.

Then the correspondence is exact:

| Code | What it counts |
| --- | --- |
| `Self::num_ways(left)` | Valid orders within the left subtree |
| `Self::num_ways(right)` | Valid orders within the right subtree |
| `choose(n - 1, k, MOD)` | Positions for the `k` left values among all `n - 1` positions after the root |

Multiplying those counts gives all valid orders for the current subtree. The reductions after each multiplication keep every intermediate residue below `MOD`. Here, the product of two residues is less than $$p^2$$, which fits in `u64`; that is why the recursive expression does not need the `u128` casts used in the more general arithmetic helpers.

For `[3,4,5,1,2]`, the partition gives `[1,2]` and `[4,5]`. Both recursive calls return `1`, and `choose(4, 2, MOD)` returns `6`. The wrapper then returns **5**.

I have written the final subtraction in the normalized form `(ways + MOD - 1) % MOD`. This is the usual way to keep a modular subtraction in range. Under this problem's constraints, the count residue is actually nonzero: every factorial in the binomial factors has index below the prime, so all those factors—and their product—are nonzero modulo the prime. My original `ways as i32 - 1` therefore also works here; the normalized expression makes the modular arithmetic explicit.

### Cost of this implementation

Partitioning a subtree of size $$m$$ takes $$O(m)$$ time. A balanced tree therefore takes $$O(n\log n)$$ time across its recursion levels, while a chain gives the sum $$n+(n-1)+\cdots+1$$ and takes **$$O(n^2)$$ time** in the worst case. The one-time factorial-table preprocessing is separate.

There is a memory detail worth making explicit for this version: each recursive call owns its `nums` vector and allocates new vectors for its children. The parent's input remains in scope while its descendants are processed. On a chain, these live buffers can also add up to **$$O(n^2)$$ space**, plus the $$O(B)$$ cached tables. The call stack alone is $$O(h)$$ for tree height $$h$$, reaching $$O(n)$$ in the worst case. For a balanced tree, the live vector storage is $$O(n)$$. These bounds describe the vector-based implementation above, rather than just the abstract recurrence.

## 9. What I took away from this problem

The part I struggled with was not identifying the root or splitting the values. It was noticing the extra restrictions I had introduced into the count. First, I imagined each subtree as one contiguous block. Then, I imagined finishing an entire depth before moving to the next. Both ideas counted some valid orders, but neither counted all of them.

The hints brought me back to the first idea with a better question: after choosing an order for each side, **how can those two orders share the remaining positions?** Once I saw that as choosing slots, the missing binomial factor had a clear meaning.

That is the lesson I want to remember: when two recursive pieces can be arranged independently, multiplying their counts may only be part of the answer. I also need to count the ways those pieces can be combined. Here, preserving each side's internal order while choosing its positions was enough to turn a promising first recurrence into the complete solution.
