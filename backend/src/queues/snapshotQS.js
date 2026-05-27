const supabase = require('../services/supabase')
const googleAds = require('../services/googleAds')

async function snapshotQSCuenta(cuentaId, customerId, refreshToken) {
  const keywords = await googleAds.getQSSnapshot(refreshToken, customerId)
  if (!keywords.length) return { keywords: 0 }

  const hoy = new Date().toISOString().slice(0, 10)
  const rows = keywords.map(k => ({
    cuenta_id:                cuentaId,
    keyword_text:             k.keywordText,
    keyword_resource_name:    k.keywordResourceName,
    quality_score:            k.qualityScore,
    creative_quality_score:   k.creativeQualityScore,
    post_click_quality_score: k.postClickQualityScore,
    search_predicted_ctr:     k.searchPredictedCtr,
    fecha:                    hoy,
  }))

  await supabase
    .from('qs_historico')
    .upsert(rows, { onConflict: 'cuenta_id,keyword_text,fecha' })

  console.log(`[QS Snapshot] Cuenta ${cuentaId}: ${keywords.length} keywords guardadas`)
  return { keywords: keywords.length }
}

module.exports = { snapshotQSCuenta }
