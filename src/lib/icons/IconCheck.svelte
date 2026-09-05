<script lang="ts">
  let { size = 18, class: className = '' } = $props<{ size?: number; class?: string }>();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class={className} aria-hidden="true">
  <polyline points="20 6 9 17 4 12" />
</svg>
