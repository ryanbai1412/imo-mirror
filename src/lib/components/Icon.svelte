<script lang="ts" module>
  export type IconName =
    | "Calendar"
    | "ChevronRight"
    | "FileText"
    | "Globe"
    | "Menu"
    | "Search"
    | "User"
    | "X";
</script>

<script lang="ts">
  import {
    Calendar,
    ChevronRight,
    FileText,
    Globe,
    Menu,
    Search,
    User,
    X,
  } from "lucide-static";
  import { resizeSvg } from "$lib/utils/svgResize";

  const icons: Record<IconName, string> = {
    Calendar,
    ChevronRight,
    FileText,
    Globe,
    Menu,
    Search,
    User,
    X,
  };

  let {
    name,
    size = 18,
    class: className = "",
  }: {
    name: IconName;
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
