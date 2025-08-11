/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */

module.exports = (data = {}) => {
  const {
    company_name,
    ai_dialer_name,
    candidate_name,
    skill_set,
    job_title,
    hr_email,
    location,
    call_back_number,
    prompt
  } = data

  const variables = {
    company_name,
    ai_dialer_name,
    candidate_name,
    skill_set,
    job_title,
    hr_email,
    location,
    call_back_number
  }

  function interpolate (template, variables) {
    return template.replace(/\${(.*?)}/g, (match, p1) => {
      const key = p1.trim()
      return key in variables ? variables[key] : ''
    })
  }

  const interpolatedPrompt = interpolate(prompt, variables)

  return interpolatedPrompt
}
