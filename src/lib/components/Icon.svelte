<script lang="ts">
	import * as icons from 'lucide-static';
	import { resizeSvg } from '$lib/utils/svgResize';

	export let name: keyof typeof icons;
	export let size: number = 18;
	let className: string = '';
	export { className as class };

	$: raw = icons[name] as string;
	$: svg = resizeSvg(raw, size);
	$: html = className ? svg.replace('<svg', `<svg class="${className}"`) : svg;
</script>

{@html html}
