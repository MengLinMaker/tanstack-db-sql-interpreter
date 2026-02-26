import { indentWithTab } from '@codemirror/commands'
import { sql } from '@codemirror/lang-sql'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { createEffect, onCleanup, onMount } from 'solid-js'

type SqlTextInputProps = {
  value?: string
  onChange?: (value: string) => void
  readOnly?: boolean
  class?: string
}

export function SqlTextInput(props: SqlTextInputProps) {
  let host: HTMLDivElement | undefined
  let view: EditorView | undefined

  const className = () =>
    props.class ? `sql-input ${props.class}` : 'sql-input'

  onMount(() => {
    const extensions = [
      basicSetup,
      sql(),
      keymap.of([indentWithTab]),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return
        props.onChange?.(update.state.doc.toString())
      }),
    ]

    if (props.readOnly) {
      extensions.push(EditorState.readOnly.of(true))
      extensions.push(EditorView.editable.of(false))
    }

    view = new EditorView({
      parent: host!,
      doc: props.value ?? '',
      extensions,
    })
  })

  createEffect(() => {
    if (!view) return
    if (props.value === undefined) return
    const current = view.state.doc.toString()
    if (props.value === current) return
    view.dispatch({
      changes: { from: 0, to: current.length, insert: props.value },
    })
  })

  onCleanup(() => {
    view?.destroy()
  })

  return <div ref={host} class={className()} />
}
