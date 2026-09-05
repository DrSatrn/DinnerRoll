<script lang="ts">
  let { size = 28, class: className = '' } = $props<{ size?: number; class?: string }>();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 32 32"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  class={className}
  aria-hidden="true"
>
  <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2.5" />
  <path
    d="M16 6C21.5 6 26 10.5 26 16C26 21.5 21.5 26 16 26C11 26 7.5 22 8.5 17C9.5 12 14 11 17 12.5C19.5 13.7 20 16.5 18.5 18C17 19.5 14.5 19 14.5 17"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
  />
</svg>
