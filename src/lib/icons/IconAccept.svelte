<script lang="ts">
  let { size = 18, class: className = '' } = $props<{ size?: number; class?: string }>();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class={className} aria-hidden="true">
  <circle cx="12" cy="12" r="9" />
  <path d="M8.5 12.5l2.5 2.5 5-5" />
</svg>
