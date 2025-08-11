module.exports = (currentValue, previousValue) => {
  let percent
  if (previousValue === 0) {
    // if nothing to compare against, treat any new activity as +100%
    percent = currentValue === 0 ? 0 : 100
  } else {
    percent = ((currentValue - previousValue) / previousValue) * 100
  }
  const rounded = Math.round(percent)
  return {
    trend: `${percent >= 0 ? '+' : ''}${rounded}%`,
    trendUp: percent >= 0
  }
}
