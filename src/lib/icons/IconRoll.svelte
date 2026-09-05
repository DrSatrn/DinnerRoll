<script lang="ts">
  let { size = 18, class: className = '' } = $props<{ size?: number; class?: string }>();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={className} aria-hidden="true">
  <rect x="3" y="3" width="18" height="18" rx="4" />
  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
  <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
  <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
</svg>
