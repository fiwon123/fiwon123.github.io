# Dev Sandbox Shell Configuration
# Sets a [SANDBOX] badge in the prompt and the terminal title.

# Skip if not in a container
[ -f /.dockerenv ] || return 0

[ -n "$__sandbox_configured" ] && return 0
__sandbox_configured=1

# --- mise: keep managed toolchains on PATH -----------------------------------
# A sandbox reset (or a fresh non-login shell) keeps the installed toolchains but
# not the PATH entry that pointed at them, so a mise-managed `go`/`node`/`uv` can
# vanish from the shell. Put mise's shim directory on PATH directly: it is
# shell-agnostic and safe for non-interactive shells, unlike `mise activate`.
__mise_shims="${MISE_DATA_DIR:-$HOME/.local/share/mise}/shims"
if [ -d "$__mise_shims" ]; then
    case ":$PATH:" in
        *":$__mise_shims:"*) ;;
        *) export PATH="$__mise_shims:$PATH" ;;
    esac
fi
unset __mise_shims

if [ -n "$ZSH_VERSION" ]; then
    __sandbox_set_title() {
        printf '\033]0;[SANDBOX] felipeinoue.com — %s\007' "${PWD:t}"
    }
    if [[ $- == *i* ]]; then
        autoload -U colors && colors
        PROMPT='%F{red}[SANDBOX]%f %F{blue}%~%f $ '
        (( ${precmd_functions[(Ie)__sandbox_set_title]} )) || precmd_functions+=(__sandbox_set_title)
    else
        __sandbox_set_title
    fi
    return
fi

__sandbox_set_title() {
    printf '\033]0;[SANDBOX] felipeinoue.com — %s\007' "${PWD##*/}"
}

if [[ $- == *i* ]]; then
    export PS1='\[\e[1;31m\][SANDBOX]\[\e[0m\] \[\e[34m\]\w\[\e[0m\] \$ '
    PROMPT_COMMAND="__sandbox_set_title${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
else
    __sandbox_set_title
fi
