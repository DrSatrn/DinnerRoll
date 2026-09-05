<script lang="ts">
  let { size = 18, class: className = '' } = $props<{ size?: number; class?: string }>();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={className} aria-hidden="true">
  <path d="M4 18h16" />
  <path d="M4 14a8 8 0 0 1 16 0" />
  <circle cx="12" cy="5" r="1" fill="currentColor" />
  <path d="M12 6v2" />
</svg>
