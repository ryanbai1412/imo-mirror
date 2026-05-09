<script lang="ts">
  import * as icons from "lucide-static";
  import { resizeSvg } from "$lib/utils/svgResize";

  let {
    name,
    size = 18,
    class: className = "",
  }: {
    name: keyof typeof icons;
    size?: number;
    class?: string;
  } = $props();

  let raw = $derived(icons[name] as string);
  let svg = $derived(resizeSvg(raw, size));
  let html = $derived(
    className ? svg.replace("<svg", `<svg class="${className}"`) : svg
  );
</script>

{@html html}
