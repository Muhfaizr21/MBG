import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, Upload, X, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react"

export async function convertToWebP(sourceFile, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(sourceFile)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1920
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (w > MAX) { h = Math.round(h * (MAX / w)); w = MAX }
      if (h > MAX) { w = Math.round(w * (MAX / h)); h = MAX }
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      canvas.getContext("2d").drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Gagal konversi ke WebP")); return }
          resolve({ blob, previewUrl: URL.createObjectURL(blob) })
        },
        "image/webp",
        quality,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("File gambar tidak valid")) }
    img.src = url
  })
}

export function ImageCapturePanel({ onCapture, disabled = false, label = "Ambil / Unggah Foto", hint }) {
  const [mode, setMode] = useState("idle")
  const [preview, setPreview] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [facing, setFacing] = useState("environment")
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => () => stopCamera(), [])

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const startCamera = async (facingMode) => {
    const fm = facingMode ?? facing
    stopCamera()
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: fm, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setMode("camera")
    } catch (err) {
      setCameraError(
        err.name === "NotAllowedError"
          ? "Izin kamera ditolak. Aktifkan akses kamera di pengaturan browser."
          : `Kamera tidak tersedia: ${err.message}`,
      )
    }
  }

  const flipCamera = async () => {
    const next = facing === "environment" ? "user" : "environment"
    setFacing(next)
    await startCamera(next)
  }

  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d").drawImage(video, 0, 0)
    stopCamera()
    setMode("converting")
    canvas.toBlob(async (rawBlob) => {
      try {
        const { blob, previewUrl } = await convertToWebP(rawBlob)
        setPreview(previewUrl)
        setMode("preview")
        onCapture?.(blob, previewUrl)
      } catch (e) {
        setCameraError(`Gagal konversi: ${e.message}`)
        setMode("idle")
      }
    }, "image/jpeg", 0.95)
  }

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setCameraError("File harus berupa gambar (jpg, png, webp, heic, dll.)")
      return
    }
    setMode("converting")
    try {
      const { blob, previewUrl } = await convertToWebP(file)
      setPreview(previewUrl)
      setMode("preview")
      onCapture?.(blob, previewUrl)
    } catch (e) {
      setCameraError(`Gagal memproses gambar: ${e.message}`)
      setMode("idle")
    }
  }, [onCapture])

  const handleFileInput = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (file) handleFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const reset = () => {
    stopCamera()
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setCameraError(null)
    setMode("idle")
    onCapture?.(null, null)
  }

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      )}

      {mode === "preview" && preview && (
        <div className="relative rounded-2xl overflow-hidden border border-emerald-300 shadow-md">
          <img src={preview} alt="Preview gambar" className="w-full max-h-72 object-cover" />
          <div className="absolute top-2 right-2 flex gap-2">
            <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
              <CheckCircle2 className="h-3 w-3" /> WebP
            </span>
            {!disabled && (
              <button type="button" onClick={reset} title="Hapus & ambil ulang"
                className="bg-white/90 backdrop-blur-sm text-slate-700 rounded-full p-1.5 shadow hover:bg-white transition cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {mode === "camera" && (
        <div className="relative rounded-2xl overflow-hidden border border-amber-400 shadow-lg bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-72 object-cover" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-6 border-2 border-dashed border-amber-400/80 rounded-xl animate-pulse" />
            <span className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 text-amber-300 text-[10px] font-mono px-3 py-1 rounded-full">
              ARAHKAN KE OBJEK MAKANAN
            </span>
          </div>
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2">
            <button type="button" onClick={flipCamera} title="Ganti kamera"
              className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button type="button" onClick={captureFromCamera}
              className="px-6 py-2 rounded-full bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition shadow-lg cursor-pointer">
              Ambil Foto
            </button>
            <button type="button" onClick={reset} title="Batalkan"
              className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {mode === "converting" && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 py-10 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Mengkonversi ke WebP...</p>
        </div>
      )}

      {mode === "idle" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={[
            "rounded-2xl border-2 border-dashed transition-all p-6 flex flex-col items-center gap-4",
            isDragging ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:border-slate-300",
            disabled ? "opacity-50 pointer-events-none" : "",
          ].join(" ")}
        >
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button type="button" onClick={() => startCamera()} disabled={disabled}
              className="flex flex-col items-center gap-2 px-5 py-3 rounded-2xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition shadow-md cursor-pointer disabled:opacity-50">
              <Camera className="h-6 w-6" />
              Buka Kamera
            </button>
            <span className="text-slate-300 text-sm font-bold">atau</span>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled}
              className="flex flex-col items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition shadow-md cursor-pointer disabled:opacity-50">
              <Upload className="h-6 w-6" />
              Upload Gambar
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed max-w-xs">
            {isDragging
              ? "Lepaskan untuk mengunggah gambar"
              : (hint || "Drag & drop gambar, buka kamera, atau klik Upload • Otomatis dikonversi ke WebP")}
          </p>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
        </div>
      )}

      {cameraError && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-700 leading-relaxed flex-1">{cameraError}</p>
          <button type="button" onClick={() => setCameraError(null)} className="text-rose-400 hover:text-rose-600 cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

export default ImageCapturePanel
