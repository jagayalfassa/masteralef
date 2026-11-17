"""Alineación forzada local (sin créditos) de grabaciones de aliyot con su texto.

Modelo: MahmoudAshraf/mms-300m-1130-forced-aligner (MMS, CTC, texto romanizado con uroman).
Uso como módulo: emissions(path) -> (logprobs[T,V], seg_por_frame); align_words(...)
"""
import re, unicodedata
import numpy as np
import torch, torchaudio
from transformers import AutoModelForCTC, AutoTokenizer
import uroman as ur

MODEL = 'MahmoudAshraf/mms-300m-1130-forced-aligner'
torch.set_num_threads(2)
_m = AutoModelForCTC.from_pretrained(MODEL).eval()
_tok = AutoTokenizer.from_pretrained(MODEL)
_ur = ur.Uroman()
VOCAB = _tok.get_vocab()
BLANK = VOCAB.get('<blank>', 0)
SR = 16000


def load(path):
    import subprocess
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return torch.from_numpy(np.frombuffer(raw, dtype=np.float32).copy())


@torch.inference_mode()
def emissions(path, win=30, ctx=2):
    wav = load(path)
    W, C = win * SR, ctx * SR
    outs = []
    for s in range(0, len(wav), W):
        a, b = max(0, s - C), min(len(wav), s + W + C)
        x = wav[a:b]
        x = (x - x.mean()) / (x.std() + 1e-7)
        lp = torch.log_softmax(_m(x[None]).logits[0], -1)
        fps = lp.shape[0] / ((b - a) / SR)
        i0 = int(round((s - a) / SR * fps)); i1 = i0 + int(round(min(W, len(wav) - s) / SR * fps))
        outs.append(lp[i0:i1])
    lp = torch.cat(outs)
    return lp, len(wav) / SR / lp.shape[0]


def romanize(word):
    w = ''.join(c for c in unicodedata.normalize('NFD', word) if not ('֑' <= c <= '֯' or c in 'ֽ׀׃׳״'))
    w = w.replace('־', ' ')
    r = _ur.romanize_string(w).lower()
    r = ''.join(c for c in r if c in VOCAB and c != ' ')
    return r or 'a'


def align_words(lp, sec, words):
    toks, owner = [], []
    for i, w in enumerate(words):
        for c in romanize(w):
            toks.append(VOCAB[c]); owner.append(i)
    tgt = torch.tensor([toks], dtype=torch.int32)
    ali, scores = torchaudio.functional.forced_align(lp[None], tgt, blank=BLANK)
    ali, scores = ali[0], scores[0].exp()
    spans = torchaudio.functional.merge_tokens(ali, scores, blank=BLANK)
    out = [[None, None, []] for _ in words]
    for sp, o in zip(spans, owner):
        st = out[o]
        st[0] = sp.start if st[0] is None else st[0]; st[1] = sp.end; st[2].append(sp.score)
    res = [(round(a * sec, 2), round(b * sec, 2), float(np.mean(s))) for a, b, s in out]
    return res, float(np.mean([r[2] for r in res]))


def greedy(lp):
    """Transcripción romanizada aproximada (argmax CTC) para identificar qué texto suena."""
    inv = {v: k for k, v in VOCAB.items()}
    ids = lp.argmax(-1).tolist(); out, prev = [], None
    for i in ids:
        if i != prev and i != BLANK:
            out.append(inv.get(i, ''))
        prev = i
    return ''.join(c for c in out if c.isalpha())


def text_sim(lp_greedy, words):
    import difflib
    ref = ''.join(romanize(w) for w in words)
    ref = ''.join(c for c in ref if c.isalpha())
    return difflib.SequenceMatcher(None, lp_greedy, ref, autojunk=False).ratio()
