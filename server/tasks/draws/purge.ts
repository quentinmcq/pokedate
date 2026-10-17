export default defineTask({
  meta: { name: 'draws:purge', description: 'Delete public draws older than seven days' },
  async run({ context }) {
    const { DB } = bindingsFromContext(context)
    if (DB) await purgeExpiredDraws(DB)
    return { result: DB ? 'purged' : 'no database' }
  },
})
