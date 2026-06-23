package validator

import (
	"errors"
	"strings"
	"unicode"
)

// ValidatePassword 验证密码（MVP：8 位以上，含字母和数字）
func ValidatePassword(password string) error {
	if len(password) < 8 {
		return errors.New("密码至少 8 位")
	}
	if len(password) > 64 {
		return errors.New("密码不能超过 64 位")
	}

	var hasLetter, hasNumber bool
	for _, char := range password {
		if unicode.IsLetter(char) {
			hasLetter = true
		}
		if unicode.IsNumber(char) {
			hasNumber = true
		}
	}

	if !hasLetter {
		return errors.New("密码需包含至少一个字母")
	}
	if !hasNumber {
		return errors.New("密码需包含至少一个数字")
	}

	lower := strings.ToLower(password)
	for _, weak := range []string{"password", "12345678", "qwertyui"} {
		if strings.Contains(lower, weak) {
			return errors.New("密码过于简单，请换一个")
		}
	}

	return nil
}
