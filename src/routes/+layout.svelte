<script lang="ts">
	import '$lib/data-store';
	import '../app.css';
	import { page } from '$app/stores';
	import { SITE_NAME } from '$lib/utils/seo';
	import Icon from '$lib/components/Icon.svelte';

	const NAV_ITEMS = [
		{ label: 'Timeline', href: '/organizers.aspx', prefixes: ['/organizers.aspx', '/year_info.aspx', '/year_country_r.aspx', '/year_individual_r.aspx', '/year_statistics.aspx'] },
		{ label: 'Countries', href: '/countries.aspx', prefixes: ['/countries.aspx', '/country_info.aspx', '/country_team_r.aspx', '/country_individual_r.aspx', '/country_hall.aspx', '/team_r.aspx'] },
		{ label: 'Results', href: '/results_country.aspx', prefixes: ['/results_country.aspx', '/results_year.aspx', '/results_matrix.aspx'] },
		{ label: 'Hall of Fame', href: '/hall.aspx', prefixes: ['/hall.aspx', '/hall_of_fame.aspx', '/participant_r.aspx'] },
		{ label: 'Statistics', href: '/statistics.aspx', prefixes: ['/statistics.aspx'] }
	];

	$: currentPath = $page.url.pathname;
	$: isActive = (item: (typeof NAV_ITEMS)[number]) => item.prefixes.some((p) => currentPath === p);
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
	<script src="/js/chart-utils.js"></script>
</svelte:head>

<div class="site-wrapper">
	<header class="site-header">
		<div class="header-inner">
			<a href="/" class="site-logo">
				<img src="/imo-logo.gif" alt="IMO Logo" class="logo-img" width="106" height="80" />
				<h1>International Mathematical Olympiad</h1>
			</a>
			<nav class="main-nav">
				{#each NAV_ITEMS as item}
					<a href={item.href} class:active={isActive(item)}>{item.label}</a>
				{/each}
				<button id="cmd-trigger" class="header-search-box" aria-label="Search (Cmd+K)">
					<Icon name="Search" size={13} />
					<span>Search</span>
					<kbd class="nav-kbd">⌘K</kbd>
				</button>
			</nav>
		</div>
	</header>
	<div class="site-main">
		<slot />
	</div>
	<footer class="site-footer">
		<div class="footer-inner">
			<span>Static mirror of <a href="https://www.imo-official.org" target="_blank" rel="noopener noreferrer">imo-official.org</a></span>
			<span>This site is <a href="https://github.com/ryanbai1412/imo-mirror" target="_blank" rel="noopener noreferrer">open source</a>.</span>
			<span><a href="https://github.com/ryanbai1412/imo-mirror/issues/new" target="_blank" rel="noopener noreferrer">Report a bug</a></span>
		</div>
	</footer>
</div>

<style>
	.site-header {
		background: var(--navy); color: #fff;
		position: sticky; top: 0; z-index: 100;
		box-shadow: 0 2px 12px rgba(0,0,0,0.2);
	}
	.header-inner {
		max-width: var(--max-width); margin: 0 auto;
		padding: 0 24px;
		display: flex; align-items: center;
		justify-content: space-between; height: 56px;
	}
	.site-logo {
		display: flex; align-items: center;
		gap: 10px; text-decoration: none; color: #fff;
	}
	.site-logo:hover {
		color: var(--gold-light);
		text-decoration: none;
	}
	.logo-img {
		height: 36px; width: auto; flex-shrink: 0;
		border-radius: 3px;
	}
	.site-logo h1 {
		font-family: var(--font-display);
		font-size: 20px; font-weight: 400;
		letter-spacing: 0.01em; white-space: nowrap;
	}
	.main-nav {
		display: flex; align-items: center; gap: 0;
	}
	.main-nav a {
		color: rgba(255,255,255,0.75);
		padding: 6px 14px;
		font-size: 13px; font-weight: 500;
		border-radius: 4px;
		transition: all var(--transition);
		white-space: nowrap;
	}
	.main-nav a:hover {
		color: #fff;
		background: rgba(255,255,255,0.08);
		text-decoration: none;
	}
	.main-nav a.active {
		color: var(--gold-light);
	}
	.site-footer {
		background: var(--navy);
		color: rgba(255,255,255,0.5);
		padding: 24px; text-align: center;
		font-size: 12px; margin-top: auto;
	}
	.site-footer a {
		color: rgba(255,255,255,0.7);
	}
	.site-footer a:hover {
		color: var(--gold-light);
		text-decoration: none;
	}
	.footer-inner {
		max-width: var(--max-width); margin: 0 auto;
		display: flex; align-items: center;
		justify-content: space-between; gap: 16px;
	}
	.header-search-box {
		display: flex; align-items: center; gap: 6px;
		padding: 5px 10px;
		background: rgba(255,255,255,0.08);
		border: 1px solid rgba(255,255,255,0.18);
		border-radius: var(--radius);
		color: rgba(255,255,255,0.55);
		font-size: 13px; font-weight: 500;
		font-family: var(--font-body);
		cursor: pointer;
		transition: all var(--transition);
		margin-left: 6px;
	}
	.header-search-box:hover {
		background: rgba(255,255,255,0.14);
		border-color: rgba(255,255,255,0.28);
		color: rgba(255,255,255,0.85);
	}
	.nav-kbd {
		font-size: 11px; font-family: var(--font-body);
		padding: 1px 5px;
		background: rgba(255,255,255,0.1);
		border: 1px solid rgba(255,255,255,0.15);
		border-radius: 4px;
		color: rgba(255,255,255,0.45);
		line-height: 1.4;
		margin-left: 2px;
	}
	@media (max-width: 768px) {
		.header-inner {
			flex-direction: column;
			height: auto; padding: 12px 16px; gap: 8px;
		}
		.main-nav {
			flex-wrap: wrap; justify-content: center;
		}
		.footer-inner { flex-direction: column; }
	}
</style>
