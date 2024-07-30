---
author:
- Richard A. Neher
title: Estimating frequencies
---

Estimating frequency trajectories from count data is a recurring problem
in many of our analyses. We previously fitted to a sampling likelihood
with a stiffness prior of the type
$$L(\{p_i\} | \{n_i\}, \{k_i\}) \sim \prod_i p_i^{k_i} (1-p_i)^{n_i-k_i} \times \prod_i e^{ - \lambda (p_i - p_{i-1})^2/2}$$
where the stiffness $\lambda$ might want to depend on $p_i$ itself. If
regularization is diffusive, we expect the parameter $\lambda$ the scale
as $\lambda = 1/2D(t_i-t_{i-1})$. This non-linear likelihood is
difficult to optimize. Since we don't really think that the data we have
is well described by iid sampling, we might just as well approximate the
binomial sampling LH by a gaussian with mean $\hat{p}_i = k_i/n_i$ and
variance $$\sigma^2 = \frac{k_i(n_i-k_i)}{n_i^3}$$ Not that this
variance diverges when $n_i=0$, corresponding to the case when there is
no information. The log-likelihood then looks like this
$$logL(\{p_i\} | \{n_i\}, \{k_i\}) = C + \sum_i n_i\frac{(k_i - p_i n_i)^2}{2k_i(n_i-k_i)}  + \sum_i \lambda (p_i - p_{i-1})^2/2$$
We still need to guard this against cases where $k_i=0$ or $k_i=n_i$, or
more generally cases where the binomial is not well approximated by a
Gaussian. This can be achieved by simply inflating the variance -- the
variance is anyway underestimated by the idd approximation. Here, we add
pseudo-counts $p_c$ to both terms of the variance.
$$logL(\{p_i\} | \{n_i\}, \{k_i\}) = C + \sum_i n_i\frac{(k_i - p_i n_i)^2}{2(k_i+p_c)(n_i-k_i+p_c)}  + \sum_i \lambda (p_i - p_{i-1})^2/2$$
The next question is how the stiffness $\lambda$ should scale with the
number of samples and the time discretization. If our null is that the
true frequencies change diffusively, $\lambda \sim 1/D\Delta t$. The
absolute value of the stiffness should be related to how much we expect
frequencies to change from one month to the next. For influenza, this is
typically on the order of $\sqrt{Dt} \sim 0.1$, which suggests that $Dt$
should be on the order of 100. A month is 30 days, so a value around
1000 seems sensible.

The benefit of this Gaussian model is that this can be solved exactly.
The minimum is obtained by setting the derivative with respect to $p_j$
to 0.
$$\partial_j logL(\{p_i\} | \{n_i\}, \{k_i\}) = n_j^2\frac{(k_j - p_j n_j)}{(k_j+p_c)(n_j-k_j+p_c)} - \lambda (2p_j - p_{j-1}-p_{j+1}) = 0$$
For $j=0$ the last term is just $\lambda (p_1 - p_0)$, for $p_m$, the
$-\lambda (p_m - p_{m-1})$ This is a very sparse linear system of
equations that owing to the stiffness constraint should non-degenerate.
Rearranging this to separate constant and $p_i$ dependent parts yields
$$\frac{n_j^3}{(k_j+p_c)(n_j-k_j+p_c)}p_j  + \lambda (2p_j - p_{j-1} - p_{j+1}) =  \frac{n_j^2 k_j}{(k_j+p_c)(n_j-k_j+p_c)}$$

The second derivative of the objective function with respect to
frequencies would have the diagonal elements
$$\frac{n_i^3}{(k_i+p_c)(n_i-k_i+p_c)} + 2\lambda$$ and off-diagonal
elements $(i, i+1)$ of $-\lambda$. The confidence intervals would then
be the square root of the diagonal of the inverse of this Hessian.

Hierarchial frequencies {#hierarchial-frequencies .unnumbered}
=======================

Different countries in a region are pretty well mixed but deviate from
the region-average frequency. It thus makes sense to tie them together.
If we express the frequency in a country as
$p_c(t_i) = p_r(t_i) + \Delta p_c(t_i)$ we can regularize the
$\Delta p_c$ to with a quadratic penalty. The Gaussian logLH is thus
$$logL(\{p_i\} | \{n_i\}, \{k_i\}) = C + \sum_i \sum_c n^c_i\frac{(k^c_i - (p_i + \Delta p^c) n^c_i)^2}{2(k^c_i+p_c)(n^c_i-k^c_i+p_c)}  + \sum_i \lambda (p_i - p_{i-1})^2/2 + \frac{1}{2}\sum_i\sum_c \left(\lambda (\Delta p^c_i - \Delta p^c_{i-1})^2 +\mu (\Delta p^c_{i})^2\right)$$
The derivative with respect to the $p_i$ and $\Delta p_i^c$ now look
somewhat different. The derivative with respect to $p_j$ is
$$-\sum_c (n^c_j)^2\frac{(k^c_j - (p_j + \Delta p^c_j) n^c_j)}{(k^c_j+p_c)(n^c_j-k^c_j+p_c)}  + \lambda (2p_j - p_{j-1}- p_{j+1}) = 0$$
and can be rearranged to
$$\sum_c \frac{(n^c_j)^3}{(k^c_j+p_c)(n^c_j-k^c_j+p_c)} (p_j + \Delta p^c)   + \lambda (2p_j - p_{j-1}- p_{j+1}) = \sum_c \frac{(n^c_j)^2 k^c_j}{(k^c_j+p_c)(n^c_j-k^c_j+p_c)}$$
This will generate a number of off-diagonal terms, but it should still
be a pretty sparse matrix.

The derivative with respect to $\Delta p^d_j$ is
$$-(n^d_j)^2\frac{(k^d_j - (p_j + \Delta p^d_j) n^d_j)}{(k^d_j+p_c)(n^d_j-k^d_j+p_c)}  + \lambda (2\Delta p^d_j - \Delta p^d_{j-1}- \Delta p^d_{j+1}) + \mu \Delta p_j^d = 0$$
$$\frac{(n^d_j)^3}{(k^d_j+p_c)(n^d_j-k^d_j+p_c)}(p_j + \Delta p^d_j)   + \lambda (2\Delta p^d_j - \Delta p^d_{j-1}- \Delta p^d_{j+1}) + \mu \Delta p_j^d = \frac{k^d_j(n^d_j)^2}{(k^d_j+p_c)(n^d_j-k^d_j+p_c)}$$
