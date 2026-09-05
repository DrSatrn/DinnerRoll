<script lang="ts">
  let { size = 18, class: className = '' } = $props<{ size?: number; class?: string }>();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={className} aria-hidden="true">
  <path d="M12 2v4" />
  <path d="M4.93 4.93l2.83 2.83" />
  <path d="M2 12h4" />
  <path d="M20 12h2" />
  <path d="M16.24 7.76l2.83-2.83" />
  <path d="M4 18h16" />
  <path d="M7 18a5 5 0 0 1 10 0" />
</svg>
