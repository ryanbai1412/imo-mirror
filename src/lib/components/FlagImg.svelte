<script lang="ts">
  let {
    src,
    alt,
    size = "sm",
  }: {
    src: string;
    alt: string;
    size?: "sm" | "lg";
  } = $props();
</script>

<img
  {src}
  {alt}
  class="country-flag"
  class:lg={size === "lg"}
  width={size === "lg" ? 33 : 21}
  height={size === "lg" ? 22 : 14}
  loading="lazy"
  decoding="async"
/>

<style>
  .country-flag {
    width: 21px;
    height: 14px;
    object-fit: cover;
    vertical-align: middle;
    border-radius: 1px;
  }
  .country-flag.lg {
    display: inline;
    width: 33px;
    height: 22px;
    vertical-align: baseline;
    margin-right: 6px;
    border-radius: 2px;
    box-shadow: var(--shadow-sm);
  }
</style>
