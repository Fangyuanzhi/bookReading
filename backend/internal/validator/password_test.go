package validator

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
		errMsg   string
	}{
		{name: "valid password", password: "reader123", wantErr: false},
		{name: "valid with symbol", password: "Test123!", wantErr: false},
		{name: "too short", password: "Te1!", wantErr: true, errMsg: "至少 8 位"},
		{name: "no letter", password: "12345678", wantErr: true, errMsg: "字母"},
		{name: "no number", password: "abcdefgh", wantErr: true, errMsg: "数字"},
		{name: "too common", password: "password123", wantErr: true, errMsg: "过于简单"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePassword(tt.password)
			if tt.wantErr {
				assert.Error(t, err)
				if tt.errMsg != "" && err != nil {
					assert.Contains(t, err.Error(), tt.errMsg)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
