/**
 * Strips <think> tags from a continuous stream of tokens.
 */
export class StreamingThinkStripper {
  private buffer = ''
  private inThink = false

  process(token: string) {
    this.buffer += token
    let output = ''

    while (this.buffer.length > 0) {
      if (this.inThink) {
        const endIdx = this.buffer.indexOf('</think>')
        if (endIdx !== -1) {
          this.inThink = false
          this.buffer = this.buffer.slice(endIdx + 8)
        } else {
          // keep buffering until </think> arrives
          break
        }
      } else {
        const startIdx = this.buffer.indexOf('<think>')
        if (startIdx !== -1) {
          output += this.buffer.slice(0, startIdx)
          this.inThink = true
          this.buffer = this.buffer.slice(startIdx + 7)
        } else {
          // Check if a partial <think> is forming at the end
          const match = this.buffer.match(/<[^>]*$/)
          if (match && '<think>'.startsWith(match[0])) {
            output += this.buffer.slice(0, match.index)
            this.buffer = this.buffer.slice(match.index)
            break // wait for more tokens
          } else {
            output += this.buffer
            this.buffer = ''
          }
        }
      }
    }
    return output
  }

  flush() {
    return this.inThink ? '' : this.buffer
  }
}

export function stripThinkTags(text: string) {
  // Removes complete <think>...</think> blocks
  let c = text.replace(/<think>[\s\S]*?<\/think>/gi, '')
  // Removes incomplete <think>... blocks at the end
  c = c.replace(/<think>[\s\S]*$/gi, '')
  return c.trim()
}
