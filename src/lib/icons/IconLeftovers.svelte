<script lang="ts">
  let { size = 18, class: className = '' } = $props<{ size?: number; class?: string }>();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={className} aria-hidden="true">
  <path d="M21 8l-2-2-2 2" />
  <path d="M19 6v5a4 4 0 0 1-4 4H5" />
  <path d="M3 16l2 2 2-2" />
  <path d="M5 18v-5a4 4 0 0 1 4-4h10" />
</svg>
