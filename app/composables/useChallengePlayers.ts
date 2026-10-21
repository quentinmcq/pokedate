import type { Message } from '#shared/utils/messages'

export interface PlayerFormError {
  player: string
  error: Message
}

export function useChallengePlayers() {
  const { t } = useLocaleTools()

  const playerLabel = (name: string, number: number) => cleanPlayerName(name) || t('challenge.player', { number })

  const describePlayerError = (formError: PlayerFormError | null) =>
    formError
      ? t('challenge.playerError', {
          player: formError.player,
          error: t(formError.error.key, formError.error.params ?? {}),
        })
      : ''

  return { playerLabel, describePlayerError }
}
